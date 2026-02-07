// ============================================================================
// GOVERNANCE RULES — Directive CRMC
// Affichage des 3 règles de gouvernance dans Settings
// ============================================================================

import { Shield, Database, History, ExternalLink } from 'lucide-react';
import { Card, Badge } from '@/components/ui';

const rules = [
  {
    numero: 1,
    titre: 'Zéro donnée hardcodée',
    description:
      'Tout paramètre métier (seuils, poids, labels) doit provenir de la base de données. ' +
      'Les constantes du code servent uniquement de valeurs par défaut. ' +
      'Les administrateurs peuvent modifier ces paramètres via l\'onglet "Paramètres métier".',
    icon: Database,
    statut: 'actif',
    lienOnglet: 'parametres',
  },
  {
    numero: 2,
    titre: 'Protection des données existantes',
    description:
      'Les mises à jour du code ne doivent jamais écraser les données saisies par les utilisateurs. ' +
      'Les imports et synchronisations respectent les verrouillages manuels. ' +
      'Un backup automatique est créé avant chaque import. ' +
      'Les opérations destructives requièrent une double confirmation avec code.',
    icon: Shield,
    statut: 'actif',
  },
  {
    numero: 3,
    titre: 'Traçabilité complète',
    description:
      'Chaque modification sur les tables métier (actions, jalons, risques, budget) est automatiquement ' +
      'historisée avec la source (utilisateur, calcul auto, sync Firebase, import, migration), ' +
      'l\'auteur et l\'horodatage. Le middleware Dexie intercepte toutes les écritures.',
    icon: History,
    statut: 'actif',
  },
];

export function GovernanceRules() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card padding="md">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Shield className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-primary-900">
              Directive CRMC — Gouvernance des données
            </h3>
            <p className="text-sm text-primary-500">
              3 règles permanentes pour l'intégrité des données du Cockpit
            </p>
          </div>
        </div>
      </Card>

      {/* Rules */}
      {rules.map((rule) => {
        const Icon = rule.icon;
        return (
          <Card key={rule.numero} padding="md">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 font-bold">{rule.numero}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="h-5 w-5 text-primary-600" />
                  <h4 className="font-semibold text-primary-900">{rule.titre}</h4>
                  <Badge variant="success">{rule.statut}</Badge>
                </div>
                <p className="text-sm text-primary-600 leading-relaxed">
                  {rule.description}
                </p>
                {rule.lienOnglet && (
                  <button
                    onClick={() => {
                      const params = new URLSearchParams(window.location.search);
                      params.set('tab', rule.lienOnglet!);
                      window.history.replaceState({}, '', `?${params.toString()}`);
                      window.dispatchEvent(new PopStateEvent('popstate'));
                      window.location.search = params.toString();
                    }}
                    className="inline-flex items-center gap-1 mt-2 text-xs text-primary-500 hover:text-primary-700 underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Voir l'onglet Paramètres métier
                  </button>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
