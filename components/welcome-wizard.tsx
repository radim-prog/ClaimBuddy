'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, FileText, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface WelcomeWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

const SLIDES = [
  {
    icon: FileText,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    title: 'Vítejte v Pojistná Pomoc',
    description:
      'Pojistná Pomoc je váš osobní asistent pro vyřizování pojistných událostí. Pomůžeme vám dostat maximum z vaší pojistky.',
    features: [
      'Komunikace s pojišťovnou v vašem jméně',
      'Příprava všech potřebných dokumentů',
      'Real-time sledování průběhu',
    ],
  },
  {
    icon: Clock,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-100',
    title: 'Ušetřete čas a nervy',
    description:
      'Průměrné vyřízení pojistky zabere 15-20 hodin vašeho času. My to vyřídíme za vás během 14 dní.',
    features: [
      'Žádné telefonáty s pojišťovnou',
      'Žádné papírování a formuláře',
      'Profesionální péče od začátku do konce',
    ],
  },
  {
    icon: TrendingUp,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-100',
    title: 'Získejte více peněz',
    description:
      'Průměrně našim klientům vyjednáváme o 23% více, než pojišťovny původně nabízejí. Víme, jak na to.',
    features: [
      'Zkušení bývalí pojišťovací agenti',
      'Znalost interních procesů pojišťoven',
      'Success fee model - platíte jen když vyjednáme více',
    ],
  },
];

export function WelcomeWizard({ onComplete, onSkip }: WelcomeWizardProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const handleSkip = () => {
    setIsVisible(false);
    setTimeout(() => {
      onSkip();
    }, 300);
  };

  if (!isVisible) return null;

  const slide = SLIDES[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card
        className={cn(
          'relative w-full max-w-2xl p-8 md:p-12 shadow-2xl transition-all duration-300',
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        )}
      >
        {/* Close Button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Zavřít"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        {/* Content */}
        <div className="text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className={cn('flex h-20 w-20 items-center justify-center rounded-2xl', slide.iconBg)}>
              <Icon className={cn('h-10 w-10', slide.iconColor)} />
            </div>
          </div>

          {/* Title */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              {slide.title}
            </h2>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              {slide.description}
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3 py-6">
            {slide.features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-3 text-left max-w-md mx-auto"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <p className="text-gray-700 flex-1">{feature}</p>
              </div>
            ))}
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 py-4">
            {SLIDES.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={cn(
                  'h-2 rounded-full transition-all',
                  index === currentSlide
                    ? 'w-8 bg-primary'
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                )}
                aria-label={`Přejít na slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center gap-4 pt-4">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentSlide === 0}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Zpět
            </Button>

            <Button onClick={handleSkip} variant="ghost" className="text-gray-500">
              Přeskočit prohlídku
            </Button>

            <Button onClick={handleNext} className="gap-2">
              {currentSlide === SLIDES.length - 1 ? (
                'Začít'
              ) : (
                <>
                  Další
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
