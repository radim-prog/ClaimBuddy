'use client';

import { useState, useEffect, useRef } from 'react';
import { Message } from '@/types';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { Avatar } from '@/components/ui/avatar';
import { Send, User } from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CaseMessagesProps {
  caseId: string;
}

export function CaseMessages({ caseId }: CaseMessagesProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!caseId) return;

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('caseId', '==', caseId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Message;
      });
      setMessages(messagesData);

      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [caseId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      setSending(true);

      const response = await fetch(`/api/cases/${caseId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          type: 'user',
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se odeslat zprávu. Zkuste to prosím znovu.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Komunikace s týmem</h3>

      {/* Messages List */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto rounded-lg border p-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-8">
            Zatím žádné zprávy. Začněte konverzaci níže.
          </p>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.userId === user?.uid;
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                </div>

                {/* Message Content */}
                <div className={`flex-1 ${isCurrentUser ? 'text-right' : ''}`}>
                  <div className="flex items-baseline gap-2">
                    <p className={`text-sm font-medium text-gray-900 ${isCurrentUser ? 'order-2' : ''}`}>
                      {message.userName}
                    </p>
                    <time className={`text-xs text-gray-500 ${isCurrentUser ? 'order-1' : ''}`}>
                      {format(new Date(message.createdAt), 'dd. MM. HH:mm', {
                        locale: cs,
                      })}
                    </time>
                  </div>
                  <div
                    className={`mt-1 inline-block rounded-lg px-4 py-2 ${
                      isCurrentUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="flex gap-2">
        <Textarea
          placeholder="Napište zprávu..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          rows={3}
          className="resize-none"
          disabled={sending}
        />
        <Button
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || sending}
          size="icon"
          className="h-auto"
        >
          {sending ? <Spinner size="sm" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
