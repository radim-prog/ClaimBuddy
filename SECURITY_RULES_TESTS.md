# Firebase Security Rules - Test Scenarios

**Datum:** 2025-11-01
**Kategorie:** Critical Security Fix
**Status:** Rules updated, ready for deployment

---

## Storage Rules Tests

### ✅ MĚLO BY FUNGOVAT:

1. **User A uploaduje soubor do svého case**
   - User A je vlastník caseId
   - Soubor je PDF nebo obrázek
   - Velikost < 25 MB

2. **User A čte soubor ze svého case**
   - User A je vlastník caseId
   - Path: `/cases/{caseId}/**`

3. **Admin čte soubor z jakéhokoliv case**
   - User má `role: 'admin'` v Firestore
   - Může přistupovat ke všem cases

4. **User A smaže soubor ze svého case**
   - User A je vlastník caseId
   - Může mazat vlastní soubory

5. **User A uploaduje vlastní avatar**
   - Path: `/avatars/{userId}/**`
   - Pouze obrázky, < 25 MB

### ❌ MĚLO BY FAILNOUT:

1. **User A čte soubor z case User B** ⚠️ CRITICAL
   - caseOwnedByUser() vrátí false
   - Přístup odepřen

2. **User A uploaduje soubor do case User B** ⚠️ CRITICAL
   - caseOwnedByUser() vrátí false
   - Upload odepřen

3. **User A smaže soubor z case User B** ⚠️ CRITICAL
   - caseOwnedByUser() vrátí false
   - Delete odepřen

4. **Neautentizovaný uživatel uploaduje soubor**
   - `request.auth == null`
   - Vše odepřeno

5. **Upload souboru > 25 MB**
   - `isUnder25MB()` vrátí false
   - Upload odepřen

6. **Upload .exe nebo .zip souboru**
   - `isValidDocumentFile()` vrátí false
   - Pouze: image/*, application/pdf

---

## Firestore Rules Tests

### ✅ MĚLO BY FUNGOVAT:

1. **User A čte své cases**
   - `resource.data.userId == request.auth.uid`
   - Vrátí pouze vlastní cases

2. **User A vytváří nový case**
   - `request.resource.data.userId == request.auth.uid`
   - Case se vytvoří s userId

3. **User A posílá message do svého case**
   - `caseOwnedByUser(caseId)` vrátí true
   - Message má povinná pole: content, userId, type, createdAt

4. **Admin čte všechny cases**
   - `isAdmin()` vrátí true
   - Přístup ke všem cases

5. **Admin updatuje jakýkoliv case**
   - Admin má plný přístup
   - Může měnit status, assignee, atd.

6. **User A čte své messages**
   - Parent case má `userId == request.auth.uid`
   - Vrátí messages z vlastních cases

### ❌ MĚLO BY FAILNOUT:

1. **User A čte case User B** ⚠️ CRITICAL
   - `resource.data.userId != request.auth.uid`
   - Case není viditelný

2. **User A čte messages z case User B** ⚠️ CRITICAL
   - `caseOwnedByUser(caseId)` vrátí false
   - Messages nejsou přístupné

3. **User A posílá message do case User B** ⚠️ CRITICAL
   - `caseOwnedByUser(caseId)` vrátí false
   - Create message odepřen

4. **User A smaže vlastní case**
   - Pouze admin může mazat
   - Delete odepřen

5. **Neautentizovaný uživatel vytváří case**
   - `request.auth == null`
   - Create odepřen

6. **User A mění userId v case update**
   - Firebase Rules neumožňují změnu userId
   - Update odepřen (implicitně)

7. **User A vytváří message bez povinných polí**
   - `request.resource.data.keys().hasAll([...])` vrátí false
   - Create odepřen

---

## Jak testovat

### 1. Firebase Emulator Suite (Lokální testování)

```bash
# Spusť emulátory
firebase emulators:start --only firestore,storage

# V jiném terminálu spusť testy (pokud existují)
npm run test:rules
```

**Vytvořit test suite:**
```javascript
// test/rules.test.js
const firebase = require('@firebase/rules-unit-testing');

describe('Storage Security Rules', () => {
  it('should deny cross-user file access', async () => {
    // User A nemůže číst soubory User B
  });
});
```

---

### 2. Production Manual Test

**Postup:**
1. Vytvořit 2 test účty:
   - userA@test.com (ID: `userA_123`)
   - userB@test.com (ID: `userB_456`)

2. **Test 1: Cross-case file reading**
   ```javascript
   // User A vytvoří case + upload file
   const caseA = await createCase({ userId: 'userA_123' });
   await uploadFile(`cases/${caseA.id}/document.pdf`);

   // User B zkusí přistoupit
   // EXPECTED: Permission denied
   const ref = storage.ref(`cases/${caseA.id}/document.pdf`);
   await ref.getDownloadURL(); // Should FAIL
   ```

3. **Test 2: Cross-case messages**
   ```javascript
   // User B zkusí číst messages User A
   // EXPECTED: Empty result / Permission denied
   const messages = await firestore
     .collection('cases').doc(caseA.id)
     .collection('messages')
     .get(); // Should return empty or fail
   ```

4. **Test 3: Admin access**
   ```javascript
   // Admin account může přistupovat ke všem cases
   // EXPECTED: Success
   const allCases = await firestore.collection('cases').get();
   // Admin vidí všechny cases
   ```

---

### 3. Firebase Console Rules Playground

**Storage Rules:**
```
Location: /cases/case123/document.pdf
Operation: get
Auth: { uid: 'userA_123' }
Request: -
```

**Test scenario:**
1. Set `uid = 'userA_123'`
2. Location: `/cases/case_of_userB/document.pdf`
3. Simulate: GET operation
4. **Expected:** ❌ DENY

**Firestore Rules:**
```
Location: /cases/case123/messages/msg456
Operation: get
Auth: { uid: 'userA_123' }
```

**Test scenario:**
1. Resource data: `{ caseId: 'case_of_userB' }`
2. Simulate: GET operation
3. **Expected:** ❌ DENY

---

## Opravené security holes

### 🔴 BEFORE (Vulnerable):

**Storage Rules:**
```javascript
match /cases/{caseId}/{allPaths=**} {
  allow read: if isAuthenticated(); // ❌ Jakýkoliv user čte cokoliv!
}
```

**Firestore Rules:**
```javascript
match /messages/{messageId} {
  allow read: if isAuthenticated(); // ❌ Jakýkoliv user čte všechny messages!
}
```

### 🟢 AFTER (Secure):

**Storage Rules:**
```javascript
match /cases/{caseId}/{allPaths=**} {
  allow read: if isAuthenticated() &&
                 (caseOwnedByUser(caseId) || isAdmin()); // ✅ Pouze vlastník nebo admin
}
```

**Firestore Rules:**
```javascript
match /messages/{messageId} {
  allow read: if isAuthenticated() &&
                 (caseOwnedByUser(caseId) || isAdmin()); // ✅ Pouze vlastník nebo admin
}
```

---

## Critical Security Impact

**Před opravou:**
- User A mohl číst/stahovat soubory User B
- User A mohl číst messages z cases User B
- Žádná kontrola ownership na file operations

**Po opravě:**
- ✅ Case ownership check pro všechny operace
- ✅ Messages jsou izolované per case
- ✅ Admin má plný přístup (pro support)
- ✅ File type validation (jen PDF + images)
- ✅ Size limit 25 MB

---

## Deploy checklist

- [ ] Zkontrolovat syntax obou rules souborů
- [ ] Deploy Storage Rules: `firebase deploy --only storage:rules`
- [ ] Deploy Firestore Rules: `firebase deploy --only firestore:rules`
- [ ] Otestovat cross-user access (měl by být zamítnut)
- [ ] Otestovat admin access (měl by fungovat)
- [ ] Monitorovat Firebase Console → Usage → Errors
- [ ] Ověřit že existing users mají stále přístup ke svým datům

---

## Monitoring po deployi

```bash
# Sleduj Firebase logs
firebase functions:log

# Zkontroluj Security Rules errors
# Firebase Console → Firestore/Storage → Usage → Security Rules Errors
```

**Expected:**
- První 24h může být zvýšený počet "permission denied" errors
- To je OČEKÁVANÉ - jsou to zablokované cross-user attempts
- Pokud legitimní users reportují problémy → zkontroluj userId matching

---

**Status:** ✅ Rules připraveny k deployi
**Next step:** Deploy do production a monitoring
