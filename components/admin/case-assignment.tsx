'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { auth } from '@/lib/firebase/client';

interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
  activeCasesCount: number;
  resolvedCasesCount: number;
  avgResolutionTime?: number;
}

interface CaseAssignmentProps {
  caseId: string;
  currentAssignee?: string;
  currentAssigneeName?: string;
  onAssigned?: () => void;
}

export function CaseAssignment({
  caseId,
  currentAssignee,
  currentAssigneeName,
  onAssigned,
}: CaseAssignmentProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>(currentAssignee || '');
  const [loading, setLoading] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch available agents
  useEffect(() => {
    fetchAgents();
  }, []);

  // Update selected agent when currentAssignee changes
  useEffect(() => {
    setSelectedAgent(currentAssignee || '');
  }, [currentAssignee]);

  const fetchAgents = async () => {
    try {
      setLoadingAgents(true);
      setError(null);

      const user = auth.currentUser;
      if (!user) {
        throw new Error('Not authenticated');
      }

      const token = await user.getIdToken();
      const response = await fetch('/api/admin/agents', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch agents');
      }

      const data = await response.json();
      setAgents(data.agents || []);
    } catch (err: any) {
      console.error('Error fetching agents:', err);
      setError(err.message || 'Failed to load agents');
    } finally {
      setLoadingAgents(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedAgent) {
      setError('Prosím vyberte agenta');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const user = auth.currentUser;
      if (!user) {
        throw new Error('Not authenticated');
      }

      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/cases/${caseId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ agentId: selectedAgent }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to assign case');
      }

      setSuccess('Případ byl úspěšně přiřazen');
      onAssigned?.();
    } catch (err: any) {
      console.error('Error assigning case:', err);
      setError(err.message || 'Nepodařilo se přiřadit případ');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const user = auth.currentUser;
      if (!user) {
        throw new Error('Not authenticated');
      }

      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/cases/${caseId}/assign`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to unassign case');
      }

      setSelectedAgent('');
      setSuccess('Přiřazení bylo odebráno');
      onAssigned?.();
    } catch (err: any) {
      console.error('Error unassigning case:', err);
      setError(err.message || 'Nepodařilo se odebrat přiřazení');
    } finally {
      setLoading(false);
    }
  };

  const selectedAgentData = agents.find((agent) => agent.id === selectedAgent);
  const hasChanges = selectedAgent !== currentAssignee;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Přiřazení agenta
        </CardTitle>
        <CardDescription>
          {currentAssigneeName
            ? `Aktuálně přiřazeno: ${currentAssigneeName}`
            : 'Případ není přiřazen žádnému agentovi'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error/Success Messages */}
        {error && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </div>
        )}

        {/* Agent Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Vyberte agenta</label>
          <Select
            value={selectedAgent}
            onValueChange={setSelectedAgent}
            disabled={loadingAgents || loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Vyberte agenta..." />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{agent.name}</span>
                    <span className="text-xs text-gray-500">
                      {agent.activeCasesCount} aktivních •{' '}
                      {agent.resolvedCasesCount} vyřešených
                      {agent.avgResolutionTime &&
                        ` • průměr ${agent.avgResolutionTime.toFixed(1)} dní`}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Agent Info */}
        {selectedAgentData && (
          <div className="rounded-md bg-blue-50 p-3 text-sm">
            <div className="font-medium text-blue-900">{selectedAgentData.name}</div>
            <div className="text-blue-700">{selectedAgentData.email}</div>
            <div className="mt-1 text-xs text-blue-600">
              Aktivní případy: {selectedAgentData.activeCasesCount} • Vyřešené:{' '}
              {selectedAgentData.resolvedCasesCount}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleAssign}
            disabled={!selectedAgent || loading || !hasChanges}
            className="flex-1"
          >
            {loading ? 'Zpracovávám...' : 'Přiřadit'}
          </Button>

          {currentAssignee && (
            <Button
              onClick={handleUnassign}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Odebrat přiřazení
            </Button>
          )}
        </div>

        {/* Loading State */}
        {loadingAgents && (
          <div className="text-center text-sm text-gray-500">Načítám agenty...</div>
        )}
      </CardContent>
    </Card>
  );
}
