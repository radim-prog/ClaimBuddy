# Deploy Security Rules - Manuální návod

**Datum:** 2025-11-01
**Status:** ✅ Rules připraveny, čekají na deploy
**Commit:** `60a1f30`

---

## 🚨 CRITICAL: Security Rules jsou připraveny k deployi

**Co bylo opraveno:**
- ❌ Cross-user file access (Storage Rules)
- ❌ Cross-case message reading (Firestore Rules)
- ✅ Case ownership validation
- ✅ Admin role support

---

## Rychlý Deploy (2 kroky)

### 1️⃣ Autentizace Firebase CLI

```bash
cd /Users/Radim/Projects/claimbuddy

# Re-autentizuj Firebase CLI
firebase login --reauth

# Nebo pokud je to CI/headless:
firebase login:ci
```

### 2️⃣ Deploy Rules

```bash
# Deploy STORAGE Rules
firebase deploy --only storage:rules --project claimbuddy-1c327

# Deploy FIRESTORE Rules
firebase deploy --only firestore:rules --project claimbuddy-1c327

# Nebo obojí najednou:
firebase deploy --only storage:rules,firestore:rules --project claimbuddy-1c327
```

**Expected output:**
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/claimbuddy-1c327/overview
```

---

## Alternativa: Firebase Console (GUI)

Pokud Firebase CLI nefunguje, můžeš deploynout přes web:

### Storage Rules:

1. Otevři: https://console.firebase.google.com/project/claimbuddy-1c327/storage/rules
2. Zkopíruj obsah souboru: `/Users/Radim/Projects/claimbuddy/storage.rules`
3. Vlož do editoru
4. Klikni **Publish**

### Firestore Rules:

1. Otevři: https://console.firebase.google.com/project/claimbuddy-1c327/firestore/rules
2. Zkopíruj obsah souboru: `/Users/Radim/Projects/claimbuddy/firestore.rules`
3. Vlož do editoru
4. Klikni **Publish**

---

## ⚠️ Po deployi - Testování

### Test 1: Cross-user access (měl by být ZAMÍTNUT)

```javascript
// V Developer Tools Console na claimbuddy.cz

// 1. Přihlas se jako User A
// 2. Vytvoř case, získej caseId

// 3. Přihlas se jako User B
// 4. Zkus přistoupit k case User A:

const storage = getStorage();
const fileRef = ref(storage, 'cases/CASE_ID_USER_A/document.pdf');

// EXPECTED: Permission denied error
await getDownloadURL(fileRef);
// ❌ Firebase: User does not have permission to access this object
```

### Test 2: Vlastní cases (měl by FUNGOVAT)

```javascript
// Přihlášený User A

const storage = getStorage();
const fileRef = ref(storage, 'cases/CASE_ID_USER_A/document.pdf');

// EXPECTED: Success
await getDownloadURL(fileRef);
// ✅ https://firebasestorage.googleapis.com/...
```

### Test 3: Admin access (měl by FUNGOVAT pro všechny cases)

```javascript
// Přihlášený admin user (role: 'admin' v Firestore)

const storage = getStorage();
const fileRef = ref(storage, 'cases/ANY_CASE_ID/document.pdf');

// EXPECTED: Success
await getDownloadURL(fileRef);
// ✅ Admin má přístup ke všem cases
```

---

## 📊 Monitoring po deployi

### Firebase Console - Security Errors

1. **Storage**: https://console.firebase.google.com/project/claimbuddy-1c327/storage/usage
2. **Firestore**: https://console.firebase.google.com/project/claimbuddy-1c327/firestore/usage

**Co sledovat:**
- První 24h: zvýšený počet "Permission denied" errors je OK
- To jsou zablokované cross-user attempts (expected behavior)
- Pokud legitimní users hlásí problémy → zkontroluj userId matching

### Logs

```bash
# Firebase Functions logs (pokud jsou deploýnuté)
firebase functions:log --project claimbuddy-1c327

# Nebo v Console:
# https://console.firebase.google.com/project/claimbuddy-1c327/functions/logs
```

---

## 🔍 Ověření že rules jsou deploynuté

### Storage Rules:

```bash
# Stáhni aktuální rules z Firebase
firebase storage:rules:get --project claimbuddy-1c327 > storage.rules.deployed

# Porovnej s lokálním souborem
diff storage.rules storage.rules.deployed
```

### Firestore Rules:

```bash
# Stáhni aktuální rules
firebase firestore:rules:get --project claimbuddy-1c327 > firestore.rules.deployed

# Porovnej
diff firestore.rules firestore.rules.deployed
```

**Expected:** Žádný rozdíl (soubory jsou identické)

---

## 📝 Změněné soubory

### `/Users/Radim/Projects/claimbuddy/storage.rules`

**Nové helper functions (L28-36):**
```javascript
function isAdmin() {
  return isAuthenticated() &&
         firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin';
}

function caseOwnedByUser(caseId) {
  let caseData = firestore.get(/databases/(default)/documents/cases/$(caseId)).data;
  return caseData.userId == request.auth.uid;
}
```

**Opravená case rules (L39-53):**
```javascript
match /cases/{caseId}/{allPaths=**} {
  // Read: only case owner or admin
  allow read: if isAuthenticated() &&
                 (caseOwnedByUser(caseId) || isAdmin());

  // Write: only case owner with validation
  allow write: if isAuthenticated() &&
                  caseOwnedByUser(caseId) &&
                  isValidDocumentFile() &&
                  isUnder25MB();

  // Delete: only case owner or admin
  allow delete: if isAuthenticated() &&
                   (caseOwnedByUser(caseId) || isAdmin());
}
```

---

### `/Users/Radim/Projects/claimbuddy/firestore.rules`

**Nová helper function (L20-23):**
```javascript
function caseOwnedByUser(caseId) {
  let caseData = get(/databases/$(database)/documents/cases/$(caseId)).data;
  return caseData.userId == request.auth.uid;
}
```

**Opravená messages rules (L52-65):**
```javascript
match /messages/{messageId} {
  // Read: only if message belongs to user's case
  allow read: if isAuthenticated() &&
                 (caseOwnedByUser(caseId) || isAdmin());

  // Create: only into user's own case with validation
  allow create: if isAuthenticated() &&
                   caseOwnedByUser(caseId) &&
                   request.resource.data.userId == request.auth.uid &&
                   request.resource.data.keys().hasAll(['content', 'userId', 'type', 'createdAt']);

  // Update/Delete: admin only (messages should be immutable)
  allow update, delete: if isAdmin();
}
```

---

## ⚠️ Breaking Changes

**Po deployi těchto rules:**

### ❌ PŘESTANE FUNGOVAT:
- Cross-user file access (to je intended - security fix)
- Cross-case message reading (to je intended - security fix)
- Vytváření messages bez povinných polí

### ✅ BUDE FUNGOVAT:
- Users vidí pouze vlastní cases
- Users přistupují pouze k vlastním files
- Admin má plný přístup ke všemu
- Validace file type (pouze PDF + images)
- Size limit 25 MB

---

## 🚀 Po deployi

1. ✅ Ověř že deploy proběhl úspěšně
2. ✅ Zkontroluj Firebase Console → Rules verze
3. ✅ Proveď manuální test cross-user access (měl by failnout)
4. ✅ Ověř že existující users mají stále přístup k vlastním datům
5. ✅ Sleduj error logs první 24h
6. ✅ Označ issue jako resolved (pokud byl vytvořen)

---

## 🆘 Troubleshooting

### Problém: "Permission denied" pro legitimní users

**Možné příčiny:**
1. Case nemá `userId` field (legacy data)
2. `userId` v case neodpovídá `request.auth.uid`
3. User není autentizovaný

**Fix:**
```javascript
// Zkontroluj case data
const caseRef = doc(db, 'cases', caseId);
const caseSnap = await getDoc(caseRef);
console.log('Case userId:', caseSnap.data().userId);
console.log('Auth uid:', auth.currentUser.uid);
// Měly by se rovnat!
```

### Problém: Admin nemá přístup

**Možné příčiny:**
1. User nemá `role: 'admin'` v Firestore `/users/{uid}`
2. Role field chybí

**Fix:**
```javascript
// Ověř admin role
const userRef = doc(db, 'users', auth.currentUser.uid);
const userSnap = await getDoc(userRef);
console.log('User role:', userSnap.data().role);
// Mělo by být: 'admin'
```

---

**Status:** ⏳ Čeká na deploy
**Next step:** Deploy rules a monitoring

**Kontakt:** radim@wikiporadce.cz
