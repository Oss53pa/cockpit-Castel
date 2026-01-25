import { useState } from 'react';
import {
  Wallet,
  CheckCircle,
  TrendingDown,
  PiggyBank,
  AlertTriangle,
  ArrowDownLeft,
  Plus,
  MessageSquare,
  Paperclip,
  Eye,
  Pencil,
  Trash2,
  Filter,
  X,
  Calendar,
  User,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';
import {
  Card,
  Progress,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  Badge,
  Button,
} from '@/components/ui';
import { formatNumber } from '@/lib/utils';
import {
  LigneBudgetaireModal,
  ConfirmDeleteModal,
  type LigneBudgetaireComplete,
} from './LigneBudgetaireModal';

// Types pour le budget mobilisation
interface PosteBudgetaire {
  id: string;
  poste: string;
  budgetPrevu: number;
  engage: number;
  consomme: number;
  disponible: number;
  tauxConso: number;
}

// Données complètes des lignes budgétaires avec dépenses et pièces jointes
const LIGNES_BUDGETAIRES_COMPLETES: LigneBudgetaireComplete[] = [
  {
    id: '1',
    poste: 'Recrutement',
    description: 'Frais de recrutement (annonces, cabinets, tests)',
    note: 'Cabinet RH sélectionné: Talent Africa. 3 postes clés en cours.',
    prevu: 25_000_000,
    engage: 22_000_000,
    consomme: 18_000_000,
    reste: 7_000_000,
    avancement: 72,
    depenses: [
      { id: 'd1', date: '2024-01-10', description: 'Acompte cabinet Talent Africa', fournisseur: 'Talent Africa', reference: 'FA-2024-001', montant: 8_000_000, statut: 'paye' },
      { id: 'd2', date: '2024-01-25', description: 'Publication annonces LinkedIn Premium', fournisseur: 'LinkedIn', reference: 'INV-45678', montant: 1_500_000, statut: 'paye' },
      { id: 'd3', date: '2024-02-01', description: 'Tests psychométriques (lot 1)', fournisseur: 'AssessFirst', reference: 'AF-2024-123', montant: 2_500_000, statut: 'paye' },
      { id: 'd4', date: '2024-02-05', description: 'Frais de déplacement candidats', fournisseur: 'Divers', reference: 'N° facture', montant: 1_200_000, statut: 'paye' },
      { id: 'd5', date: '2024-02-10', description: 'Honoraires recrutement poste DG', fournisseur: 'Talent Africa', reference: 'FA-2024-015', montant: 4_800_000, statut: 'paye' },
      { id: 'd6', date: '2024-02-20', description: 'Solde cabinet Talent Africa', fournisseur: 'Talent Africa', reference: 'FA-2024-022', montant: 4_000_000, statut: 'engage' },
    ],
    piecesJointes: [
      { id: 'pj1', nom: 'Contrat_Cabinet_RH.pdf', taille: '245 Ko', dateAjout: '2024-01-15', type: 'pdf' },
      { id: 'pj2', nom: 'Grille_Salaires.xlsx', taille: '45 Ko', dateAjout: '2024-01-20', type: 'excel' },
    ],
    derniereModification: '2024-02-10',
  },
  {
    id: '2',
    poste: 'Recrutement',
    description: 'Salaires pré-ouverture (équipe pilote)',
    note: 'Équipe pilote de 8 personnes recrutée. Salaires versés M-3 à M-1.',
    prevu: 85_000_000,
    engage: 85_000_000,
    consomme: 60_000_000,
    reste: 25_000_000,
    avancement: 71,
    depenses: [
      { id: 'd7', date: '2024-01-31', description: 'Salaires janvier 2024', fournisseur: 'Paie interne', reference: 'PAY-2024-01', montant: 20_000_000, statut: 'paye' },
      { id: 'd8', date: '2024-02-29', description: 'Salaires février 2024', fournisseur: 'Paie interne', reference: 'PAY-2024-02', montant: 20_000_000, statut: 'paye' },
      { id: 'd9', date: '2024-03-31', description: 'Salaires mars 2024', fournisseur: 'Paie interne', reference: 'PAY-2024-03', montant: 20_000_000, statut: 'paye' },
      { id: 'd10', date: '2024-04-30', description: 'Salaires avril 2024 (prévisionnel)', fournisseur: 'Paie interne', reference: 'PAY-2024-04', montant: 25_000_000, statut: 'engage' },
    ],
    piecesJointes: [],
    derniereModification: '2024-03-15',
  },
  {
    id: '3',
    poste: 'Recrutement',
    description: 'Déplacements et hébergement candidats',
    prevu: 8_000_000,
    engage: 5_000_000,
    consomme: 3_500_000,
    reste: 4_500_000,
    avancement: 44,
    depenses: [
      { id: 'd11', date: '2024-01-20', description: 'Billets avion candidat DG', fournisseur: 'Air Côte d\'Ivoire', reference: 'ACI-4567', montant: 1_500_000, statut: 'paye' },
      { id: 'd12', date: '2024-02-05', description: 'Hôtel candidats (3 nuits)', fournisseur: 'Sofitel Abidjan', reference: 'SOF-2024-089', montant: 2_000_000, statut: 'paye' },
    ],
    piecesJointes: [],
    derniereModification: '2024-02-10',
  },
  {
    id: '4',
    poste: 'Formation',
    description: 'Formation initiale équipe (interne)',
    note: 'Programme formation 3 semaines validé. Démarrage prévu S-6.',
    prevu: 15_000_000,
    engage: 12_000_000,
    consomme: 8_000_000,
    reste: 7_000_000,
    avancement: 53,
    depenses: [
      { id: 'd13', date: '2024-02-15', description: 'Location salle de formation', fournisseur: 'Business Center', reference: 'BC-2024-034', montant: 3_000_000, statut: 'paye' },
      { id: 'd14', date: '2024-02-20', description: 'Matériel pédagogique', fournisseur: 'Office Plus', reference: 'OP-2024-112', montant: 2_000_000, statut: 'paye' },
      { id: 'd15', date: '2024-03-01', description: 'Formateur interne - honoraires', fournisseur: 'Consultant', reference: 'CONS-2024-01', montant: 3_000_000, statut: 'paye' },
      { id: 'd16', date: '2024-03-15', description: 'Repas et pauses café', fournisseur: 'Traiteur Express', reference: 'TE-2024-067', montant: 4_000_000, statut: 'engage' },
    ],
    piecesJointes: [
      { id: 'pj3', nom: 'Programme_Formation.pdf', taille: '180 Ko', dateAjout: '2024-02-10', type: 'pdf' },
    ],
    derniereModification: '2024-03-01',
  },
  {
    id: '5',
    poste: 'Formation',
    description: 'Formation externe (prestataires spécialisés)',
    prevu: 20_000_000,
    engage: 18_000_000,
    consomme: 10_000_000,
    reste: 10_000_000,
    avancement: 50,
    depenses: [
      { id: 'd17', date: '2024-02-28', description: 'Formation sécurité incendie', fournisseur: 'SecuriForm', reference: 'SF-2024-023', montant: 5_000_000, statut: 'paye' },
      { id: 'd18', date: '2024-03-10', description: 'Formation accueil client', fournisseur: 'Excellence Service', reference: 'ES-2024-045', montant: 5_000_000, statut: 'paye' },
      { id: 'd19', date: '2024-03-25', description: 'Formation gestion de caisse', fournisseur: 'Retail Academy', reference: 'RA-2024-018', montant: 8_000_000, statut: 'engage' },
    ],
    piecesJointes: [],
    derniereModification: '2024-03-10',
  },
  {
    id: '6',
    poste: 'Formation',
    description: 'Supports et documentation',
    prevu: 5_000_000,
    engage: 5_000_000,
    consomme: 5_000_000,
    reste: 0,
    avancement: 100,
    depenses: [
      { id: 'd20', date: '2024-02-15', description: 'Impression manuels de procédures', fournisseur: 'Imprimerie Nationale', reference: 'IN-2024-089', montant: 2_500_000, statut: 'paye' },
      { id: 'd21', date: '2024-02-25', description: 'Badges et supports de présentation', fournisseur: 'SignaPub', reference: 'SP-2024-034', montant: 2_500_000, statut: 'paye' },
    ],
    piecesJointes: [],
    derniereModification: '2024-02-25',
  },
  {
    id: '7',
    poste: 'Marketing',
    description: 'Identité visuelle et charte graphique',
    note: 'Charte graphique finalisée et validée par le siège.',
    prevu: 12_000_000,
    engage: 12_000_000,
    consomme: 12_000_000,
    reste: 0,
    avancement: 100,
    depenses: [
      { id: 'd22', date: '2024-01-15', description: 'Création logo et charte', fournisseur: 'Agence Créative', reference: 'AC-2024-001', montant: 8_000_000, statut: 'paye' },
      { id: 'd23', date: '2024-01-30', description: 'Déclinaisons et guide de marque', fournisseur: 'Agence Créative', reference: 'AC-2024-002', montant: 4_000_000, statut: 'paye' },
    ],
    piecesJointes: [
      { id: 'pj4', nom: 'Charte_Graphique_V2.pdf', taille: '15 Mo', dateAjout: '2024-01-30', type: 'pdf' },
      { id: 'pj5', nom: 'Logo_Declinaisons.zip', taille: '8 Mo', dateAjout: '2024-01-30', type: 'image' },
    ],
    derniereModification: '2024-01-30',
  },
  {
    id: '8',
    poste: 'Marketing',
    description: 'Site web et réseaux sociaux',
    prevu: 8_000_000,
    engage: 8_000_000,
    consomme: 6_000_000,
    reste: 2_000_000,
    avancement: 75,
    depenses: [
      { id: 'd24', date: '2024-02-01', description: 'Développement site web', fournisseur: 'WebAgency', reference: 'WA-2024-015', montant: 5_000_000, statut: 'paye' },
      { id: 'd25', date: '2024-02-15', description: 'Création contenu réseaux sociaux', fournisseur: 'SocialMedia Pro', reference: 'SMP-2024-008', montant: 1_000_000, statut: 'paye' },
      { id: 'd26', date: '2024-03-01', description: 'Maintenance et hébergement', fournisseur: 'WebAgency', reference: 'WA-2024-020', montant: 2_000_000, statut: 'engage' },
    ],
    piecesJointes: [],
    derniereModification: '2024-02-20',
  },
  {
    id: '9',
    poste: 'Marketing',
    description: 'Campagne pré-ouverture (média, affichage)',
    note: 'Campagne radio + affichage 4x3. Démarrage J-30.',
    prevu: 65_000_000,
    engage: 45_000_000,
    consomme: 25_000_000,
    reste: 40_000_000,
    avancement: 38,
    depenses: [
      { id: 'd27', date: '2024-03-01', description: 'Acompte spots radio RTI', fournisseur: 'RTI Publicité', reference: 'RTI-2024-056', montant: 15_000_000, statut: 'paye' },
      { id: 'd28', date: '2024-03-10', description: 'Affichage 4x3 Abidjan (25 panneaux)', fournisseur: 'JCDecaux CI', reference: 'JCD-2024-089', montant: 10_000_000, statut: 'paye' },
      { id: 'd29', date: '2024-03-15', description: 'Solde campagne radio', fournisseur: 'RTI Publicité', reference: 'RTI-2024-078', montant: 20_000_000, statut: 'engage' },
    ],
    piecesJointes: [
      { id: 'pj6', nom: 'Plan_Media_2024.xlsx', taille: '120 Ko', dateAjout: '2024-02-28', type: 'excel' },
    ],
    derniereModification: '2024-03-15',
  },
  {
    id: '10',
    poste: 'Marketing',
    description: 'Relations presse et RP',
    prevu: 15_000_000,
    engage: 10_000_000,
    consomme: 5_000_000,
    reste: 10_000_000,
    avancement: 33,
    depenses: [
      { id: 'd30', date: '2024-02-20', description: 'Agence RP - forfait mensuel', fournisseur: 'RP Conseil', reference: 'RPC-2024-012', montant: 5_000_000, statut: 'paye' },
      { id: 'd31', date: '2024-03-20', description: 'Organisation conférence de presse', fournisseur: 'RP Conseil', reference: 'RPC-2024-025', montant: 5_000_000, statut: 'engage' },
    ],
    piecesJointes: [],
    derniereModification: '2024-02-25',
  },
  {
    id: '11',
    poste: 'Événements',
    description: 'Soft Opening (événement VIP)',
    prevu: 25_000_000,
    engage: 15_000_000,
    consomme: 0,
    reste: 25_000_000,
    avancement: 0,
    depenses: [
      { id: 'd32', date: '2024-03-25', description: 'Acompte traiteur VIP', fournisseur: 'Gourmet Events', reference: 'GE-2024-034', montant: 10_000_000, statut: 'engage' },
      { id: 'd33', date: '2024-03-28', description: 'Location mobilier événementiel', fournisseur: 'Event Déco', reference: 'ED-2024-015', montant: 5_000_000, statut: 'engage' },
    ],
    piecesJointes: [],
    derniereModification: '2024-03-25',
  },
  {
    id: '12',
    poste: 'Événements',
    description: 'Inauguration officielle',
    note: 'Présence ministre confirmée. Traiteur en cours de sélection.',
    prevu: 45_000_000,
    engage: 20_000_000,
    consomme: 0,
    reste: 45_000_000,
    avancement: 0,
    depenses: [
      { id: 'd34', date: '2024-03-30', description: 'Réservation traiteur inauguration', fournisseur: 'Prestige Catering', reference: 'PC-2024-012', montant: 20_000_000, statut: 'engage' },
    ],
    piecesJointes: [],
    derniereModification: '2024-03-30',
  },
  {
    id: '13',
    poste: 'Événements',
    description: 'Animations ouverture (1er mois)',
    prevu: 30_000_000,
    engage: 10_000_000,
    consomme: 0,
    reste: 30_000_000,
    avancement: 0,
    depenses: [
      { id: 'd35', date: '2024-03-28', description: 'Acompte animation DJ/Artistes', fournisseur: 'Show Events', reference: 'SE-2024-007', montant: 10_000_000, statut: 'engage' },
    ],
    piecesJointes: [],
    derniereModification: '2024-03-28',
  },
  {
    id: '14',
    poste: 'IT & Équipements',
    description: 'Systèmes informatiques (ERP, caisse)',
    note: 'ERP Sage X3 installé. Formation utilisateurs en cours.',
    prevu: 35_000_000,
    engage: 35_000_000,
    consomme: 28_000_000,
    reste: 7_000_000,
    avancement: 80,
    depenses: [
      { id: 'd36', date: '2024-01-15', description: 'Licence Sage X3', fournisseur: 'Sage CI', reference: 'SAGE-2024-001', montant: 15_000_000, statut: 'paye' },
      { id: 'd37', date: '2024-02-01', description: 'Installation et paramétrage', fournisseur: 'Sage CI', reference: 'SAGE-2024-008', montant: 8_000_000, statut: 'paye' },
      { id: 'd38', date: '2024-02-15', description: 'Logiciel caisse', fournisseur: 'RetailSoft', reference: 'RS-2024-034', montant: 5_000_000, statut: 'paye' },
      { id: 'd39', date: '2024-03-01', description: 'Formation utilisateurs ERP', fournisseur: 'Sage CI', reference: 'SAGE-2024-015', montant: 7_000_000, statut: 'engage' },
    ],
    piecesJointes: [],
    derniereModification: '2024-03-01',
  },
  {
    id: '15',
    poste: 'IT & Équipements',
    description: 'Matériel bureautique et téléphonie',
    prevu: 12_000_000,
    engage: 12_000_000,
    consomme: 10_000_000,
    reste: 2_000_000,
    avancement: 83,
    depenses: [
      { id: 'd40', date: '2024-02-10', description: 'PC et imprimantes', fournisseur: 'Tech Store', reference: 'TS-2024-089', montant: 6_000_000, statut: 'paye' },
      { id: 'd41', date: '2024-02-20', description: 'Standard téléphonique', fournisseur: 'Orange Business', reference: 'OB-2024-045', montant: 4_000_000, statut: 'paye' },
      { id: 'd42', date: '2024-03-05', description: 'Accessoires et périphériques', fournisseur: 'Tech Store', reference: 'TS-2024-102', montant: 2_000_000, statut: 'engage' },
    ],
    piecesJointes: [],
    derniereModification: '2024-03-05',
  },
  {
    id: '16',
    poste: 'IT & Équipements',
    description: 'Signalétique et PLV',
    prevu: 25_000_000,
    engage: 20_000_000,
    consomme: 15_000_000,
    reste: 10_000_000,
    avancement: 60,
    depenses: [
      { id: 'd43', date: '2024-02-25', description: 'Enseignes extérieures', fournisseur: 'SignaPub', reference: 'SP-2024-056', montant: 10_000_000, statut: 'paye' },
      { id: 'd44', date: '2024-03-10', description: 'Signalétique intérieure', fournisseur: 'SignaPub', reference: 'SP-2024-078', montant: 5_000_000, statut: 'paye' },
      { id: 'd45', date: '2024-03-20', description: 'PLV et kakemonos', fournisseur: 'PrintExpress', reference: 'PE-2024-034', montant: 5_000_000, statut: 'engage' },
    ],
    piecesJointes: [],
    derniereModification: '2024-03-20',
  },
  {
    id: '17',
    poste: 'Aménagement',
    description: 'Mobilier bureaux et espaces staff',
    prevu: 18_000_000,
    engage: 18_000_000,
    consomme: 18_000_000,
    reste: 0,
    avancement: 100,
    depenses: [
      { id: 'd46', date: '2024-02-01', description: 'Bureaux et chaises', fournisseur: 'Office Design', reference: 'OD-2024-023', montant: 12_000_000, statut: 'paye' },
      { id: 'd47', date: '2024-02-15', description: 'Rangements et accessoires', fournisseur: 'Office Design', reference: 'OD-2024-034', montant: 6_000_000, statut: 'paye' },
    ],
    piecesJointes: [],
    derniereModification: '2024-02-20',
  },
  {
    id: '18',
    poste: 'Aménagement',
    description: 'Aménagement accueil et direction',
    prevu: 15_000_000,
    engage: 15_000_000,
    consomme: 12_000_000,
    reste: 3_000_000,
    avancement: 80,
    depenses: [
      { id: 'd48', date: '2024-02-20', description: 'Mobilier accueil premium', fournisseur: 'Luxury Furniture', reference: 'LF-2024-012', montant: 8_000_000, statut: 'paye' },
      { id: 'd49', date: '2024-03-01', description: 'Bureau direction et salle réunion', fournisseur: 'Luxury Furniture', reference: 'LF-2024-018', montant: 4_000_000, statut: 'paye' },
      { id: 'd50', date: '2024-03-15', description: 'Décoration et finitions', fournisseur: 'Déco Intérieur', reference: 'DI-2024-007', montant: 3_000_000, statut: 'engage' },
    ],
    piecesJointes: [],
    derniereModification: '2024-03-15',
  },
  {
    id: '19',
    poste: 'Frais généraux',
    description: 'Déplacements et missions',
    prevu: 20_000_000,
    engage: 15_000_000,
    consomme: 10_000_000,
    reste: 10_000_000,
    avancement: 50,
    depenses: [
      { id: 'd51', date: '2024-01-20', description: 'Missions Paris - Siège', fournisseur: 'Agence Voyage', reference: 'AV-2024-034', montant: 5_000_000, statut: 'paye' },
      { id: 'd52', date: '2024-02-15', description: 'Déplacements locaux', fournisseur: 'Divers', reference: 'DIV-2024-012', montant: 2_500_000, statut: 'paye' },
      { id: 'd53', date: '2024-03-01', description: 'Missions régionales', fournisseur: 'Agence Voyage', reference: 'AV-2024-056', montant: 2_500_000, statut: 'paye' },
      { id: 'd54', date: '2024-03-20', description: 'Frais de représentation', fournisseur: 'Divers', reference: 'DIV-2024-025', montant: 5_000_000, statut: 'engage' },
    ],
    piecesJointes: [],
    derniereModification: '2024-03-20',
  },
  {
    id: '20',
    poste: 'Frais généraux',
    description: 'Fournitures et consommables',
    prevu: 8_000_000,
    engage: 5_000_000,
    consomme: 3_000_000,
    reste: 5_000_000,
    avancement: 38,
    depenses: [
      { id: 'd55', date: '2024-02-10', description: 'Fournitures de bureau', fournisseur: 'Office Supplies', reference: 'OS-2024-045', montant: 2_000_000, statut: 'paye' },
      { id: 'd56', date: '2024-03-05', description: 'Consommables imprimantes', fournisseur: 'Office Supplies', reference: 'OS-2024-067', montant: 1_000_000, statut: 'paye' },
      { id: 'd57', date: '2024-03-25', description: 'Stock fournitures ouverture', fournisseur: 'Office Supplies', reference: 'OS-2024-089', montant: 2_000_000, statut: 'engage' },
    ],
    piecesJointes: [],
    derniereModification: '2024-03-25',
  },
  {
    id: '21',
    poste: 'Frais généraux',
    description: 'Assurances pré-ouverture',
    prevu: 12_000_000,
    engage: 12_000_000,
    consomme: 12_000_000,
    reste: 0,
    avancement: 100,
    depenses: [
      { id: 'd58', date: '2024-01-10', description: 'Assurance multirisque', fournisseur: 'NSIA Assurances', reference: 'NSIA-2024-001', montant: 8_000_000, statut: 'paye' },
      { id: 'd59', date: '2024-01-15', description: 'Assurance responsabilité civile', fournisseur: 'NSIA Assurances', reference: 'NSIA-2024-002', montant: 4_000_000, statut: 'paye' },
    ],
    piecesJointes: [],
    derniereModification: '2024-01-20',
  },
  {
    id: '22',
    poste: 'Provisions',
    description: 'Imprévus et aléas',
    prevu: 45_000_000,
    engage: 0,
    consomme: 0,
    reste: 45_000_000,
    avancement: 0,
    depenses: [],
    piecesJointes: [],
  },
  {
    id: '23',
    poste: 'Provisions',
    description: 'Réserve de trésorerie',
    prevu: 20_500_000,
    engage: 0,
    consomme: 0,
    reste: 20_500_000,
    avancement: 0,
    depenses: [],
    piecesJointes: [],
  },
];

// Calcul des totaux des lignes
const TOTAUX_LIGNES = LIGNES_BUDGETAIRES_COMPLETES.reduce(
  (acc, ligne) => ({
    prevu: acc.prevu + ligne.prevu,
    engage: acc.engage + ligne.engage,
    consomme: acc.consomme + ligne.consomme,
    reste: acc.reste + ligne.reste,
  }),
  { prevu: 0, engage: 0, consomme: 0, reste: 0 }
);

// Données par poste (agrégation)
const POSTES_BUDGET_MOBILISATION: PosteBudgetaire[] = [
  { id: 'recrutement', poste: 'Recrutement', budgetPrevu: 118_000_000, engage: 112_000_000, consomme: 81_500_000, disponible: 36_500_000, tauxConso: 69 },
  { id: 'formation', poste: 'Formation', budgetPrevu: 40_000_000, engage: 35_000_000, consomme: 23_000_000, disponible: 17_000_000, tauxConso: 57 },
  { id: 'marketing', poste: 'Marketing', budgetPrevu: 100_000_000, engage: 75_000_000, consomme: 48_000_000, disponible: 52_000_000, tauxConso: 48 },
  { id: 'evenements', poste: 'Événements', budgetPrevu: 100_000_000, engage: 45_000_000, consomme: 0, disponible: 100_000_000, tauxConso: 0 },
  { id: 'it_equipements', poste: 'IT & Équipements', budgetPrevu: 72_000_000, engage: 67_000_000, consomme: 53_000_000, disponible: 19_000_000, tauxConso: 74 },
  { id: 'amenagement', poste: 'Aménagement', budgetPrevu: 33_000_000, engage: 33_000_000, consomme: 30_000_000, disponible: 3_000_000, tauxConso: 91 },
  { id: 'frais_generaux', poste: 'Frais généraux', budgetPrevu: 40_000_000, engage: 32_000_000, consomme: 25_000_000, disponible: 15_000_000, tauxConso: 63 },
  { id: 'provisions', poste: 'Provisions', budgetPrevu: 65_500_000, engage: 0, consomme: 0, disponible: 65_500_000, tauxConso: 0 },
];

// Calcul des totaux
const TOTAUX_MOBILISATION = POSTES_BUDGET_MOBILISATION.reduce(
  (acc, poste) => ({
    budgetPrevu: acc.budgetPrevu + poste.budgetPrevu,
    engage: acc.engage + poste.engage,
    consomme: acc.consomme + poste.consomme,
    disponible: acc.disponible + poste.disponible,
  }),
  { budgetPrevu: 0, engage: 0, consomme: 0, disponible: 0 }
);

// Format montant en FCFA
function formatMontant(value: number): string {
  if (value === 0) return '0';
  if (value >= 1_000_000_000) return `${formatNumber(value / 1_000_000_000, 1)} Md`;
  if (value >= 1_000_000) return `${formatNumber(value / 1_000_000, 1)} M`;
  if (value >= 1_000) return `${formatNumber(value / 1_000, 1)} K`;
  return formatNumber(value, 0);
}

// Couleurs pour les graphiques
const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#71717a'];

// Couleurs par poste
const POSTE_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  'Recrutement': { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
  'Formation': { bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-100 text-green-700' },
  'Marketing': { bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
  'Événements': { bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
  'IT & Équipements': { bg: 'bg-cyan-50', text: 'text-cyan-700', badge: 'bg-cyan-100 text-cyan-700' },
  'Aménagement': { bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  'Frais généraux': { bg: 'bg-slate-50', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-700' },
  'Provisions': { bg: 'bg-gray-50', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-700' },
};

// Interface pour les données de phase détaillées
interface PhaseDetail {
  phase: string;
  prevu: number;
  engage: number;
  consomme: number;
  description: string;
  periode: string;
  responsable: string;
  lignes: Array<{
    poste: string;
    description: string;
    prevu: number;
    engage: number;
    consomme: number;
    statut: 'termine' | 'en_cours' | 'a_venir';
  }>;
  risques: string[];
  alertes: string[];
}

// Données pour le graphique par phase avec détails
const PHASES_DATA: PhaseDetail[] = [
  {
    phase: 'Pré-ouverture',
    prevu: 280_000_000,
    engage: 220_000_000,
    consomme: 150_000_000,
    description: 'Phase de préparation intensive avant l\'ouverture : recrutement des équipes clés, aménagement des espaces et mise en place des systèmes.',
    periode: 'Janvier - Septembre 2026',
    responsable: 'Center Manager',
    lignes: [
      { poste: 'Recrutement', description: 'Frais de recrutement et salaires équipe pilote', prevu: 118_000_000, engage: 112_000_000, consomme: 81_500_000, statut: 'en_cours' },
      { poste: 'IT & Équipements', description: 'Systèmes informatiques et matériel', prevu: 72_000_000, engage: 67_000_000, consomme: 53_000_000, statut: 'en_cours' },
      { poste: 'Aménagement', description: 'Mobilier et aménagement bureaux', prevu: 33_000_000, engage: 33_000_000, consomme: 30_000_000, statut: 'termine' },
      { poste: 'Frais généraux', description: 'Déplacements, fournitures, assurances', prevu: 40_000_000, engage: 32_000_000, consomme: 25_000_000, statut: 'en_cours' },
      { poste: 'Provisions', description: 'Imprévus et aléas', prevu: 17_000_000, engage: 0, consomme: 0, statut: 'a_venir' },
    ],
    risques: [
      'Retard recrutement postes clés',
      'Dépassement budget IT',
    ],
    alertes: [
      'Budget IT consommé à 74% - Surveiller',
    ],
  },
  {
    phase: 'Formation',
    prevu: 120_000_000,
    engage: 95_000_000,
    consomme: 65_000_000,
    description: 'Formation complète des équipes : formation initiale interne, formations externes spécialisées (sécurité, accueil, caisse) et supports documentaires.',
    periode: 'Juillet - Octobre 2026',
    responsable: 'RH Manager',
    lignes: [
      { poste: 'Formation interne', description: 'Formations initiales et supports', prevu: 20_000_000, engage: 17_000_000, consomme: 13_000_000, statut: 'en_cours' },
      { poste: 'Formation externe', description: 'Prestataires spécialisés', prevu: 40_000_000, engage: 38_000_000, consomme: 28_000_000, statut: 'en_cours' },
      { poste: 'Certifications', description: 'Habilitations et certifications obligatoires', prevu: 25_000_000, engage: 20_000_000, consomme: 12_000_000, statut: 'en_cours' },
      { poste: 'Supports', description: 'Documentation et manuels', prevu: 15_000_000, engage: 12_000_000, consomme: 8_000_000, statut: 'en_cours' },
      { poste: 'Logistique', description: 'Salles, repas, déplacements stagiaires', prevu: 20_000_000, engage: 8_000_000, consomme: 4_000_000, statut: 'a_venir' },
    ],
    risques: [
      'Disponibilité formateurs externes',
      'Taux de rétention post-formation',
    ],
    alertes: [],
  },
  {
    phase: 'Lancement',
    prevu: 168_500_000,
    engage: 84_000_000,
    consomme: 45_500_000,
    description: 'Phase de lancement commercial : marketing pré-ouverture, événements (soft opening et inauguration), animations du premier mois.',
    periode: 'Octobre - Décembre 2026',
    responsable: 'Marketing Manager',
    lignes: [
      { poste: 'Marketing', description: 'Campagne pré-ouverture et RP', prevu: 100_000_000, engage: 75_000_000, consomme: 48_000_000, statut: 'en_cours' },
      { poste: 'Soft Opening', description: 'Événement VIP pré-ouverture', prevu: 25_000_000, engage: 15_000_000, consomme: 0, statut: 'a_venir' },
      { poste: 'Inauguration', description: 'Cérémonie officielle', prevu: 45_000_000, engage: 20_000_000, consomme: 0, statut: 'a_venir' },
      { poste: 'Animations M1', description: 'Animations premier mois', prevu: 30_000_000, engage: 10_000_000, consomme: 0, statut: 'a_venir' },
      { poste: 'Provisions', description: 'Réserve lancement', prevu: 28_500_000, engage: 0, consomme: 0, statut: 'a_venir' },
    ],
    risques: [
      'Conditions météo inauguration',
      'Taux de participation événements',
      'Disponibilité personnalités VIP',
    ],
    alertes: [
      'Inauguration: réservation traiteur à confirmer',
    ],
  },
];

// Composant KPI Card
function KPICard({ label, value, subValue, icon: Icon, color, bgColor }: {
  label: string; value: string; subValue?: string; icon: React.ElementType; color: string; bgColor: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-primary-200 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-primary-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-primary-900">{value}</p>
          {subValue && <p className="text-xs text-primary-400 mt-1">{subValue}</p>}
        </div>
        <div className={cn('rounded-lg p-2', bgColor)}>
          <Icon className={cn('h-5 w-5', color)} />
        </div>
      </div>
    </div>
  );
}

// Composant Progress Bar
function ProgressBar({ value, size = 'sm' }: { value: number; size?: 'sm' | 'md' }) {
  const getVariant = (v: number) => {
    if (v >= 100) return 'success';
    if (v >= 75) return 'success';
    if (v >= 50) return 'warning';
    if (v >= 25) return 'default';
    return 'error';
  };
  return (
    <div className="flex items-center gap-2">
      <Progress value={value} variant={getVariant(value)} size={size} className="flex-1" />
      <span className={cn('font-medium text-primary-600', size === 'sm' ? 'text-xs w-10' : 'text-sm w-12')}>{value}%</span>
    </div>
  );
}

// Vue Synthèse
function VueSynthese() {
  const tauxEngagement = (TOTAUX_MOBILISATION.engage / TOTAUX_MOBILISATION.budgetPrevu) * 100;
  const tauxConsommation = (TOTAUX_MOBILISATION.consomme / TOTAUX_MOBILISATION.budgetPrevu) * 100;

  return (
    <div className="space-y-6">
      <Card padding="md">
        <h3 className="text-lg font-semibold text-primary-900 mb-4">Synthèse Budget Mobilisation</h3>
        <p className="text-sm text-primary-500 mb-6">Récapitulatif par poste budgétaire</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Poste</TableHead>
              <TableHead className="text-right">Budget Prévu</TableHead>
              <TableHead className="text-right">Engagé</TableHead>
              <TableHead className="text-right">Consommé</TableHead>
              <TableHead className="text-right">Disponible</TableHead>
              <TableHead className="w-32">% Conso.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {POSTES_BUDGET_MOBILISATION.map((poste) => (
              <TableRow key={poste.id}>
                <TableCell className="font-medium">{poste.poste}</TableCell>
                <TableCell className="text-right">{formatMontant(poste.budgetPrevu)}</TableCell>
                <TableCell className="text-right">{formatMontant(poste.engage)}</TableCell>
                <TableCell className="text-right">{formatMontant(poste.consomme)}</TableCell>
                <TableCell className="text-right">{formatMontant(poste.disponible)}</TableCell>
                <TableCell><ProgressBar value={poste.tauxConso} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-primary-100">
              <TableCell className="font-bold">TOTAL</TableCell>
              <TableCell className="text-right font-bold">{formatMontant(TOTAUX_MOBILISATION.budgetPrevu)}</TableCell>
              <TableCell className="text-right font-bold">{formatMontant(TOTAUX_MOBILISATION.engage)}</TableCell>
              <TableCell className="text-right font-bold">{formatMontant(TOTAUX_MOBILISATION.consomme)}</TableCell>
              <TableCell className="text-right font-bold">{formatMontant(TOTAUX_MOBILISATION.disponible)}</TableCell>
              <TableCell className="font-bold"><ProgressBar value={Math.round(tauxConsommation * 10) / 10} /></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
        <div className="grid grid-cols-2 gap-6 mt-6 pt-6 border-t">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-primary-600">Taux d'engagement</span>
              <span className="font-semibold">{tauxEngagement.toFixed(1)}%</span>
            </div>
            <Progress value={tauxEngagement} variant="default" size="md" />
          </div>
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-primary-600">Taux de consommation</span>
              <span className="font-semibold">{tauxConsommation.toFixed(1)}%</span>
            </div>
            <Progress value={tauxConsommation} variant="success" size="md" />
          </div>
        </div>
      </Card>
    </div>
  );
}

// Vue Détail - Lignes budgétaires avec modal
function VueDetail() {
  const [filterPoste, setFilterPoste] = useState<string>('all');
  const [selectedLigne, setSelectedLigne] = useState<LigneBudgetaireComplete | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [ligneToDelete, setLigneToDelete] = useState<string | null>(null);

  const postes = ['all', ...new Set(LIGNES_BUDGETAIRES_COMPLETES.map(l => l.poste))];
  const lignesFiltrees = filterPoste === 'all'
    ? LIGNES_BUDGETAIRES_COMPLETES
    : LIGNES_BUDGETAIRES_COMPLETES.filter(l => l.poste === filterPoste);

  const handleView = (ligne: LigneBudgetaireComplete) => {
    setSelectedLigne(ligne);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleEdit = (ligne: LigneBudgetaireComplete) => {
    setSelectedLigne(ligne);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleDeleteClick = (ligneId: string) => {
    setLigneToDelete(ligneId);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (ligneToDelete) {
      console.log('Suppression de la ligne:', ligneToDelete);
      // TODO: Implémenter la suppression réelle
    }
    setDeleteModalOpen(false);
    setLigneToDelete(null);
  };

  const handleSave = (ligne: LigneBudgetaireComplete) => {
    console.log('Enregistrement de la ligne:', ligne);
    // TODO: Implémenter la sauvegarde réelle
  };

  const handleDelete = (id: string) => {
    console.log('Suppression depuis le modal:', id);
    // TODO: Implémenter la suppression réelle
  };

  const handleInfosClick = (ligne: LigneBudgetaireComplete) => {
    setSelectedLigne(ligne);
    setModalMode('view');
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card padding="md">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-primary-900">Détail des lignes budgétaires</h3>
            <p className="text-sm text-primary-500">Suivi ligne par ligne du budget mobilisation</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary-400" />
              <select
                value={filterPoste}
                onChange={(e) => setFilterPoste(e.target.value)}
                className="text-sm border border-primary-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Tous les postes</option>
                {postes.filter(p => p !== 'all').map(poste => (
                  <option key={poste} value={poste}>{poste}</option>
                ))}
              </select>
            </div>
            <Button size="sm" variant="primary">
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Poste</TableHead>
                <TableHead className="min-w-[250px]">Description</TableHead>
                <TableHead className="text-right">Prévu</TableHead>
                <TableHead className="text-right">Engagé</TableHead>
                <TableHead className="text-right">Consommé</TableHead>
                <TableHead className="text-right">Reste</TableHead>
                <TableHead className="w-[140px]">Avancement</TableHead>
                <TableHead className="w-[80px] text-center">Infos</TableHead>
                <TableHead className="w-[100px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lignesFiltrees.map((ligne) => {
                const colors = POSTE_COLORS[ligne.poste] || POSTE_COLORS['Provisions'];
                const hasInfos = (ligne.depenses?.length > 0) || (ligne.piecesJointes?.length > 0) || ligne.note;
                return (
                  <TableRow key={ligne.id} className="group">
                    <TableCell>
                      <Badge className={cn('text-xs', colors.badge)}>{ligne.poste}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-primary-900">{ligne.description}</p>
                        {ligne.note && <p className="text-xs text-primary-500 mt-1">{ligne.note}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatMontant(ligne.prevu)}</TableCell>
                    <TableCell className="text-right text-blue-600">{formatMontant(ligne.engage)}</TableCell>
                    <TableCell className="text-right text-green-600">{formatMontant(ligne.consomme)}</TableCell>
                    <TableCell className="text-right text-orange-600">{formatMontant(ligne.reste)}</TableCell>
                    <TableCell><ProgressBar value={ligne.avancement} /></TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleInfosClick(ligne)}
                        className={cn(
                          'flex items-center justify-center gap-2 w-full py-1 rounded hover:bg-primary-100 transition-colors',
                          hasInfos ? 'cursor-pointer' : 'cursor-default'
                        )}
                      >
                        {ligne.depenses?.length > 0 && (
                          <div className="flex items-center gap-0.5 text-primary-500">
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span className="text-xs">{ligne.depenses.length}</span>
                          </div>
                        )}
                        {ligne.piecesJointes?.length > 0 && (
                          <div className="flex items-center gap-0.5 text-primary-500">
                            <Paperclip className="h-3.5 w-3.5" />
                            <span className="text-xs">{ligne.piecesJointes.length}</span>
                          </div>
                        )}
                        {!ligne.depenses?.length && !ligne.piecesJointes?.length && (
                          <span className="text-primary-300">-</span>
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleView(ligne)}
                          className="p-1.5 hover:bg-primary-100 rounded transition-colors"
                          title="Voir le détail"
                        >
                          <Eye className="h-4 w-4 text-primary-500" />
                        </button>
                        <button
                          onClick={() => handleEdit(ligne)}
                          className="p-1.5 hover:bg-primary-100 rounded transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4 text-primary-500" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(ligne.id)}
                          className="p-1.5 hover:bg-error-100 rounded transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4 text-error-500" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-primary-100">
                <TableCell className="font-bold" colSpan={2}>Total</TableCell>
                <TableCell className="text-right font-bold">{formatMontant(TOTAUX_LIGNES.prevu)}</TableCell>
                <TableCell className="text-right font-bold text-blue-600">{formatMontant(TOTAUX_LIGNES.engage)}</TableCell>
                <TableCell className="text-right font-bold text-green-600">{formatMontant(TOTAUX_LIGNES.consomme)}</TableCell>
                <TableCell className="text-right font-bold text-orange-600">{formatMontant(TOTAUX_LIGNES.reste)}</TableCell>
                <TableCell colSpan={3}></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </Card>

      {/* Modal de détail/modification */}
      <LigneBudgetaireModal
        ligne={selectedLigne}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleSave}
        onDelete={handleDelete}
        mode={modalMode}
      />

      {/* Modal de confirmation de suppression */}
      <ConfirmDeleteModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleConfirmDelete}
        title="Supprimer la ligne budgétaire"
        description="Êtes-vous sûr de vouloir supprimer cette ligne budgétaire ? Cette action est irréversible et supprimera également toutes les dépenses et pièces jointes associées."
      />
    </div>
  );
}

// Vue Graphiques
function VueGraphiques() {
  const chartData = POSTES_BUDGET_MOBILISATION.filter((p) => p.id !== 'provisions').map((poste) => ({
    name: poste.poste,
    prevu: poste.budgetPrevu / 1_000_000,
    engage: poste.engage / 1_000_000,
    consomme: poste.consomme / 1_000_000,
  }));

  const pieData = POSTES_BUDGET_MOBILISATION.filter((p) => p.id !== 'provisions').map((poste, index) => ({
    name: poste.poste,
    value: poste.budgetPrevu,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <Card padding="md">
        <h3 className="text-lg font-semibold text-primary-900 mb-4">Budget par poste</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e4e4e7' }} angle={-45} textAnchor="end" height={80} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#e4e4e7' }} tickFormatter={(value) => `${value}M`} />
              <Tooltip formatter={(value: number) => `${value.toFixed(1)} M FCFA`} contentStyle={{ backgroundColor: 'white', border: '1px solid #e4e4e7', borderRadius: '8px' }} />
              <Legend />
              <Bar dataKey="prevu" name="Prévu" fill="#71717a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="engage" name="Engagé" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="consomme" name="Consommé" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card padding="md">
          <h3 className="text-lg font-semibold text-primary-900 mb-4">Répartition du budget</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                  {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                </Pie>
                <Tooltip formatter={(value: number) => formatMontant(value)} contentStyle={{ backgroundColor: 'white', border: '1px solid #e4e4e7', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-primary-600 truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="md">
          <h3 className="text-lg font-semibold text-primary-900 mb-4">Taux de consommation</h3>
          <div className="space-y-4">
            {POSTES_BUDGET_MOBILISATION.filter((p) => p.id !== 'provisions').map((poste, index) => (
              <div key={poste.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-primary-600">{poste.poste}</span>
                  <span className="font-medium">{poste.tauxConso}%</span>
                </div>
                <div className="h-2 rounded-full bg-primary-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${poste.tauxConso}%`, backgroundColor: COLORS[index % COLORS.length] }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// Modal de détail de phase
function PhaseDetailModal({ phase, open, onClose }: { phase: PhaseDetail | null; open: boolean; onClose: () => void }) {
  if (!phase || !open) return null;

  const tauxConso = (phase.consomme / phase.prevu) * 100;
  const tauxEngagement = (phase.engage / phase.prevu) * 100;
  const reste = phase.prevu - phase.consomme;

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'termine': return <CheckCircle2 className="h-4 w-4 text-success-500" />;
      case 'en_cours': return <Clock className="h-4 w-4 text-info-500" />;
      default: return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'termine': return 'Terminé';
      case 'en_cours': return 'En cours';
      default: return 'À venir';
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'termine': return 'bg-success-100 text-success-700';
      case 'en_cours': return 'bg-info-100 text-info-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{phase.phase}</h2>
              <p className="text-primary-100 text-sm mt-1">{phase.description}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Metadata */}
          <div className="flex items-center gap-6 mb-6 text-sm">
            <div className="flex items-center gap-2 text-primary-600">
              <Calendar className="h-4 w-4" />
              <span>{phase.periode}</span>
            </div>
            <div className="flex items-center gap-2 text-primary-600">
              <User className="h-4 w-4" />
              <span>{phase.responsable}</span>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-primary-50 rounded-xl p-4 text-center">
              <p className="text-xs text-primary-500 mb-1">Budget prévu</p>
              <p className="text-xl font-bold text-primary-900">{formatMontant(phase.prevu)}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-xs text-blue-500 mb-1">Engagé</p>
              <p className="text-xl font-bold text-blue-700">{formatMontant(phase.engage)}</p>
              <p className="text-xs text-blue-400">{tauxEngagement.toFixed(0)}%</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-xs text-green-500 mb-1">Consommé</p>
              <p className="text-xl font-bold text-green-700">{formatMontant(phase.consomme)}</p>
              <p className="text-xs text-green-400">{tauxConso.toFixed(0)}%</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <p className="text-xs text-orange-500 mb-1">Reste à consommer</p>
              <p className="text-xl font-bold text-orange-700">{formatMontant(reste)}</p>
              <p className="text-xs text-orange-400">{(100 - tauxConso).toFixed(0)}%</p>
            </div>
          </div>

          {/* Progress bars */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-primary-600">Taux d'engagement</span>
                <span className="font-semibold text-blue-600">{tauxEngagement.toFixed(1)}%</span>
              </div>
              <Progress value={tauxEngagement} variant="default" size="md" />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-primary-600">Taux de consommation</span>
                <span className="font-semibold text-green-600">{tauxConso.toFixed(1)}%</span>
              </div>
              <Progress value={tauxConso} variant="success" size="md" />
            </div>
          </div>

          {/* Lignes budgétaires */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-primary-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary-500" />
              Détail des lignes budgétaires
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-primary-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-primary-600">Poste</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-primary-600">Prévu</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-primary-600">Engagé</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-primary-600">Consommé</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-primary-600">Statut</th>
                    <th className="px-4 py-3 text-xs font-semibold text-primary-600 w-24">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-100">
                  {phase.lignes.map((ligne, index) => {
                    const ligneAvancement = ligne.prevu > 0 ? (ligne.consomme / ligne.prevu) * 100 : 0;
                    return (
                      <tr key={index} className="hover:bg-primary-50/50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-primary-900">{ligne.poste}</p>
                          <p className="text-xs text-primary-500">{ligne.description}</p>
                        </td>
                        <td className="text-right px-4 py-3 font-medium text-primary-700">{formatMontant(ligne.prevu)}</td>
                        <td className="text-right px-4 py-3 text-blue-600">{formatMontant(ligne.engage)}</td>
                        <td className="text-right px-4 py-3 text-green-600">{formatMontant(ligne.consomme)}</td>
                        <td className="text-center px-4 py-3">
                          <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', getStatutBadge(ligne.statut))}>
                            {getStatutIcon(ligne.statut)}
                            {getStatutLabel(ligne.statut)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-primary-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${Math.min(ligneAvancement, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-primary-600 w-10">{ligneAvancement.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-primary-100">
                  <tr>
                    <td className="px-4 py-3 font-bold text-primary-900">Total</td>
                    <td className="text-right px-4 py-3 font-bold text-primary-900">{formatMontant(phase.prevu)}</td>
                    <td className="text-right px-4 py-3 font-bold text-blue-700">{formatMontant(phase.engage)}</td>
                    <td className="text-right px-4 py-3 font-bold text-green-700">{formatMontant(phase.consomme)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Risques et Alertes */}
          <div className="grid grid-cols-2 gap-6">
            {phase.risques.length > 0 && (
              <div className="bg-orange-50 rounded-xl p-4">
                <h4 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Risques identifiés
                </h4>
                <ul className="space-y-2">
                  {phase.risques.map((risque, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-orange-700">
                      <span className="text-orange-400 mt-1">•</span>
                      {risque}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {phase.alertes.length > 0 && (
              <div className="bg-red-50 rounded-xl p-4">
                <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Alertes actives
                </h4>
                <ul className="space-y-2">
                  {phase.alertes.map((alerte, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-red-700">
                      <span className="text-red-400 mt-1">•</span>
                      {alerte}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {phase.risques.length === 0 && phase.alertes.length === 0 && (
              <div className="col-span-2 bg-green-50 rounded-xl p-4 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-green-700 font-medium">Aucun risque ni alerte active</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-primary-50 flex justify-end">
          <Button onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}

// Vue Par Phase
function VueParPhase() {
  const [selectedPhase, setSelectedPhase] = useState<PhaseDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handlePhaseClick = (phase: PhaseDetail) => {
    setSelectedPhase(phase);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card padding="md">
        <h3 className="text-lg font-semibold text-primary-900 mb-4">Budget par phase de mobilisation</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={PHASES_DATA} layout="vertical" margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#e4e4e7' }} tickFormatter={(value) => `${value / 1_000_000}M`} />
              <YAxis type="category" dataKey="phase" tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#e4e4e7' }} />
              <Tooltip formatter={(value: number) => `${formatMontant(value)} FCFA`} contentStyle={{ backgroundColor: 'white', border: '1px solid #e4e4e7', borderRadius: '8px' }} />
              <Legend />
              <Bar dataKey="prevu" name="Prévu" fill="#71717a" radius={[0, 4, 4, 0]} />
              <Bar dataKey="engage" name="Engagé" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              <Bar dataKey="consomme" name="Consommé" fill="#22c55e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-6">
        {PHASES_DATA.map((phase) => {
          const tauxConso = (phase.consomme / phase.prevu) * 100;
          const tauxEngagement = (phase.engage / phase.prevu) * 100;
          return (
            <Card
              key={phase.phase}
              padding="md"
              className="cursor-pointer hover:shadow-lg hover:border-primary-300 transition-all duration-200 group"
              onClick={() => handlePhaseClick(phase)}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-primary-900">{phase.phase}</h4>
                <Eye className="h-5 w-5 text-primary-300 group-hover:text-primary-500 transition-colors" />
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-primary-500 mb-1">Budget prévu</p>
                  <p className="text-xl font-bold text-primary-900">{formatMontant(phase.prevu)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-blue-500 mb-1">Engagé</p>
                    <p className="text-lg font-semibold text-blue-900">{formatMontant(phase.engage)}</p>
                    <p className="text-xs text-primary-400">{tauxEngagement.toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-500 mb-1">Consommé</p>
                    <p className="text-lg font-semibold text-green-900">{formatMontant(phase.consomme)}</p>
                    <p className="text-xs text-primary-400">{tauxConso.toFixed(0)}%</p>
                  </div>
                </div>
                <Progress value={tauxConso} variant={tauxConso >= 50 ? 'success' : 'default'} size="md" />
                <p className="text-xs text-primary-400 text-center group-hover:text-primary-600 transition-colors">
                  Cliquer pour voir les détails
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal de détail */}
      <PhaseDetailModal
        phase={selectedPhase}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

// Composant principal Budget Mobilisation
export function BudgetMobilisation() {
  const [activeTab, setActiveTab] = useState('synthese');

  const provisions = POSTES_BUDGET_MOBILISATION.find((p) => p.id === 'provisions');
  const tauxProvisions = provisions ? (provisions.budgetPrevu / TOTAUX_MOBILISATION.budgetPrevu) * 100 : 0;
  const tauxEngagement = (TOTAUX_MOBILISATION.engage / TOTAUX_MOBILISATION.budgetPrevu) * 100;
  const tauxConsommation = (TOTAUX_MOBILISATION.consomme / TOTAUX_MOBILISATION.budgetPrevu) * 100;
  const ecart = TOTAUX_MOBILISATION.engage - TOTAUX_MOBILISATION.consomme;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-primary-900">Budget Mobilisation</h2>
        <p className="text-sm text-primary-500">Budget de lancement et démarrage (hors construction)</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard label="Budget total" value={formatMontant(TOTAUX_MOBILISATION.budgetPrevu)} subValue="FCFA" icon={Wallet} color="text-primary-600" bgColor="bg-primary-100" />
        <KPICard label="Engagé" value={formatMontant(TOTAUX_MOBILISATION.engage)} subValue={`${tauxEngagement.toFixed(1)}%`} icon={ArrowDownLeft} color="text-blue-600" bgColor="bg-blue-100" />
        <KPICard label="Consommé" value={formatMontant(TOTAUX_MOBILISATION.consomme)} subValue={`${tauxConsommation.toFixed(1)}%`} icon={CheckCircle} color="text-green-600" bgColor="bg-green-100" />
        <KPICard label="Restant" value={formatMontant(TOTAUX_MOBILISATION.disponible)} subValue="" icon={TrendingDown} color="text-orange-600" bgColor="bg-orange-100" />
        <KPICard label="Provisions" value={formatMontant(provisions?.budgetPrevu ?? 0)} subValue={`${tauxProvisions.toFixed(1)}%`} icon={PiggyBank} color="text-purple-600" bgColor="bg-purple-100" />
        <KPICard label="Écart" value={ecart >= 0 ? `+${formatMontant(ecart)}` : `-${formatMontant(Math.abs(ecart))}`} subValue="Engagé - Consommé" icon={AlertTriangle} color={ecart >= 0 ? 'text-success-600' : 'text-error-600'} bgColor={ecart >= 0 ? 'bg-success-100' : 'bg-error-100'} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="synthese">Synthèse</TabsTrigger>
          <TabsTrigger value="detail">Détail</TabsTrigger>
          <TabsTrigger value="graphiques">Graphiques</TabsTrigger>
          <TabsTrigger value="par-phase">Par phase</TabsTrigger>
        </TabsList>
        <TabsContent value="synthese"><VueSynthese /></TabsContent>
        <TabsContent value="detail"><VueDetail /></TabsContent>
        <TabsContent value="graphiques"><VueGraphiques /></TabsContent>
        <TabsContent value="par-phase"><VueParPhase /></TabsContent>
      </Tabs>
    </div>
  );
}
