'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { INSURANCE_TYPE_LABELS, INSURANCE_COMPANIES } from '@/lib/constants';
import { InsuranceType } from '@/lib/constants';

interface FormData {
  insuranceType: InsuranceType | '';
  incidentDate: string;
  incidentLocation: string;
  incidentDescription: string;
  claimAmount: string;
  policyNumber: string;
  insuranceCompany: string;
  policeReportNumber: string;
  files: File[];
}

const STEPS = [
  { number: 1, title: 'Typ pojištění', description: 'Vyberte typ pojištění' },
  { number: 2, title: 'Detaily události', description: 'Popište co se stalo' },
  { number: 3, title: 'Dokumenty', description: 'Nahrajte potřebné dokumenty' },
];

export default function NewCasePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    insuranceType: '',
    incidentDate: '',
    incidentLocation: '',
    incidentDescription: '',
    claimAmount: '',
    policyNumber: '',
    insuranceCompany: '',
    policeReportNumber: '',
    files: [],
  });

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('case-draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setFormData(draft);
        toast({
          title: 'Rozepsaný případ obnoven',
          description: 'Pokračujte tam, kde jste skončili',
        });
      } catch (err) {
        console.error('Failed to load draft:', err);
      }
    }
  }, []);

  // Autosave při každé změně formData (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.incidentDescription || formData.insuranceCompany) {
        localStorage.setItem('case-draft', JSON.stringify(formData));
      }
    }, 1000); // Save 1s po poslední změně

    return () => clearTimeout(timeoutId);
  }, [formData]);

  const validateStep1 = () => {
    if (!formData.insuranceType) {
      toast({
        title: 'Chyba validace',
        description: 'Vyberte prosím typ pojištění',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.incidentDate) {
      toast({
        title: 'Chyba validace',
        description: 'Vyplňte prosím datum události',
        variant: 'destructive',
      });
      return false;
    }
    if (!formData.incidentLocation.trim()) {
      toast({
        title: 'Chyba validace',
        description: 'Vyplňte prosím místo události',
        variant: 'destructive',
      });
      return false;
    }
    if (formData.incidentDescription.length < 50) {
      toast({
        title: 'Chyba validace',
        description: 'Popis musí obsahovat alespoň 50 znaků',
        variant: 'destructive',
      });
      return false;
    }
    if (!formData.claimAmount || parseFloat(formData.claimAmount) <= 0) {
      toast({
        title: 'Chyba validace',
        description: 'Zadejte prosím odhadovanou škodu',
        variant: 'destructive',
      });
      return false;
    }
    if (!formData.insuranceCompany) {
      toast({
        title: 'Chyba validace',
        description: 'Vyberte prosím pojišťovnu',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate file count
    if (files.length > 5) {
      toast({
        title: 'Příliš mnoho souborů',
        description: 'Můžete nahrát maximálně 5 souborů',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size and type
    const maxSize = 25 * 1024 * 1024; // 25 MB
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    for (const file of files) {
      if (file.size > maxSize) {
        toast({
          title: 'Soubor je příliš velký',
          description: `${file.name} překračuje limit 25 MB`,
          variant: 'destructive',
        });
        return;
      }
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Nepodporovaný typ souboru',
          description: `${file.name} není podporovaný. Použijte PDF, JPG, PNG, DOC nebo DOCX`,
          variant: 'destructive',
        });
        return;
      }
    }

    updateFormData('files', files);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!user) {
      toast({
        title: 'Chyba',
        description: 'Musíte být přihlášeni',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Validate all steps
      if (!validateStep1() || !validateStep2()) {
        throw new Error('Vyplňte prosím všechna povinná pole');
      }

      // KROK 1: Nejdřív vytvoř case BEZ souborů
      const caseData = {
        insuranceType: formData.insuranceType,
        insuranceCompany: formData.insuranceCompany,
        policyNumber: formData.policyNumber || undefined,
        incidentDate: formData.incidentDate,
        incidentLocation: formData.incidentLocation,
        incidentDescription: formData.incidentDescription,
        claimAmount: parseFloat(formData.claimAmount),
        policeReportNumber: formData.policeReportNumber || undefined,
      };

      const token = await user.getIdToken();
      const createResponse = await fetch('/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(caseData),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || 'Nepodařilo se vytvořit případ');
      }

      const { id: caseId } = await createResponse.json(); // API vrací 'id', ne 'caseId'

      // KROK 2: Pokud jsou soubory, uploaduj je S caseId
      if (formData.files.length > 0) {
        const uploadResults = await Promise.allSettled(
          formData.files.map(async (file) => {
            const formDataObj = new FormData();
            formDataObj.append('file', file);
            formDataObj.append('caseId', caseId); // ✅ Teď máme caseId!

            const uploadResponse = await fetch('/api/upload', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
              body: formDataObj,
            });

            if (!uploadResponse.ok) {
              const errorData = await uploadResponse.json();
              throw new Error(`Soubor ${file.name}: ${errorData.error}`);
            }

            return uploadResponse.json();
          })
        );

        // Check for failed uploads
        const failedUploads = uploadResults.filter(r => r.status === 'rejected');
        if (failedUploads.length > 0) {
          console.error('Some uploads failed:', failedUploads);
          // Don't fail the whole flow, case is already created
          toast({
            title: 'Upozornění',
            description: `${failedUploads.length} souborů se nepodařilo nahrát. Můžete je přidat později.`,
            variant: 'destructive',
          });
        }
      }

      // KROK 3: Clear draft from localStorage
      localStorage.removeItem('case-draft');

      // Success!
      toast({
        title: 'Úspěch!',
        description: 'Případ byl úspěšně vytvořen',
      });

      router.push(`/cases/${caseId}`);

    } catch (err: any) {
      console.error('Case creation error:', err);
      setError(err.message || 'Něco se pokazilo');
      toast({
        title: 'Chyba',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Nový případ</h1>
        <p className="mt-1 text-sm text-gray-500">
          Vyplňte informace o vaší pojistné události
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">
            Krok {currentStep} z {STEPS.length}
          </span>
          <span className="text-gray-500">{STEPS[currentStep - 1].title}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Steps Navigation */}
      <div className="flex justify-between">
        {STEPS.map((step) => (
          <div
            key={step.number}
            className={`flex items-center ${step.number < STEPS.length ? 'flex-1' : ''}`}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                step.number === currentStep
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : step.number < currentStep
                  ? 'border-green-600 bg-green-600 text-white'
                  : 'border-gray-300 bg-white text-gray-400'
              }`}
            >
              {step.number < currentStep ? (
                <Check className="h-5 w-5" />
              ) : (
                step.number
              )}
            </div>
            {step.number < STEPS.length && (
              <div
                className={`mx-2 h-0.5 flex-1 ${
                  step.number < currentStep ? 'bg-green-600' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form Content */}
      <Card className="p-6">
        {/* Step 1: Insurance Type */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Vyberte typ pojištění
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Jaký typ pojištění se týká vaší události?
              </p>
            </div>
            <RadioGroup
              value={formData.insuranceType}
              onValueChange={(value) =>
                updateFormData('insuranceType', value as InsuranceType)
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(INSURANCE_TYPE_LABELS).map(([value, label]) => (
                  <div key={value} className="flex items-center space-x-2">
                    <RadioGroupItem value={value} id={value} />
                    <Label htmlFor={value} className="cursor-pointer font-normal">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Step 2: Event Details */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Detaily události
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Poskytněte nám informace o vaší pojistné události
              </p>
            </div>

            <div className="grid gap-6">
              {/* Incident Date */}
              <div className="space-y-2">
                <Label htmlFor="incidentDate">
                  Datum události <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="incidentDate"
                  type="date"
                  value={formData.incidentDate}
                  onChange={(e) => updateFormData('incidentDate', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Incident Location */}
              <div className="space-y-2">
                <Label htmlFor="incidentLocation">
                  Místo události <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="incidentLocation"
                  placeholder="např. Praha 1, Václavské náměstí"
                  value={formData.incidentLocation}
                  onChange={(e) =>
                    updateFormData('incidentLocation', e.target.value)
                  }
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="incidentDescription">
                  Popis události <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="incidentDescription"
                  placeholder="Popište co se stalo, jak k události došlo..."
                  value={formData.incidentDescription}
                  onChange={(e) =>
                    updateFormData('incidentDescription', e.target.value)
                  }
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500">
                  {formData.incidentDescription.length} / 50 znaků (minimum)
                </p>
              </div>

              {/* Claim Amount */}
              <div className="space-y-2">
                <Label htmlFor="claimAmount">
                  Předpokládaná škoda (Kč) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="claimAmount"
                  type="number"
                  placeholder="50000"
                  value={formData.claimAmount}
                  onChange={(e) => updateFormData('claimAmount', e.target.value)}
                  min="0"
                  step="1000"
                />
              </div>

              {/* Insurance Company */}
              <div className="space-y-2">
                <Label htmlFor="insuranceCompany">
                  Pojišťovna <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.insuranceCompany}
                  onValueChange={(value) =>
                    updateFormData('insuranceCompany', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte pojišťovnu" />
                  </SelectTrigger>
                  <SelectContent>
                    {INSURANCE_COMPANIES.map((company) => (
                      <SelectItem key={company} value={company}>
                        {company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Policy Number */}
              <div className="space-y-2">
                <Label htmlFor="policyNumber">Číslo pojistky (volitelné)</Label>
                <Input
                  id="policyNumber"
                  placeholder="např. 123456789"
                  value={formData.policyNumber}
                  onChange={(e) => updateFormData('policyNumber', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Documents */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Nahrajte dokumenty
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Přiložte fotografie, faktury, zprávy a další dokumenty
              </p>
            </div>

            <div className="space-y-4">
              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="files">Dokumenty (volitelné)</Label>
                <div className="flex flex-col gap-2">
                  <Input
                    id="files"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-gray-500">
                    Maximálně 5 souborů, každý do 25 MB. Podporované formáty: PDF,
                    JPG, PNG, DOC, DOCX
                  </p>
                </div>
              </div>

              {/* Files Preview */}
              {formData.files.length > 0 && (
                <div className="space-y-2">
                  <Label>Vybrané soubory ({formData.files.length}/5)</Label>
                  <div className="space-y-2">
                    {formData.files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100">
                            <span className="text-xs font-medium text-gray-600">
                              {file.name.split('.').pop()?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        {currentStep > 1 ? (
          <Button variant="outline" onClick={handleBack} disabled={submitting}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zpět
          </Button>
        ) : (
          <Button variant="outline" onClick={() => router.back()}>
            Zrušit
          </Button>
        )}

        {currentStep < STEPS.length ? (
          <Button onClick={handleNext}>
            Pokračovat
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Vytváření...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Vytvořit případ
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
