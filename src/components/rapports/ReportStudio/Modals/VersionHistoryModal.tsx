import React, { useState, useMemo } from 'react';
import {
  History,
  Clock,
  ChevronRight,
  RotateCcw,
  Eye,
  GitCompare,
  FileText,
  Plus,
  Minus,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ContentTree, Section } from '@/types/reportStudio';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentContent: ContentTree;
  pastVersions: ContentTree[];
  futureVersions: ContentTree[];
  onRestoreVersion: (version: ContentTree) => void;
}

interface VersionEntry {
  version: ContentTree;
  index: number;
  type: 'past' | 'current' | 'future';
  timestamp?: Date;
  label: string;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) return 'Il y a quelques secondes';
  if (diffMin < 60) return `Il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`;
  if (diffHour < 24) return `Il y a ${diffHour} heure${diffHour > 1 ? 's' : ''}`;
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function countSections(content: ContentTree): number {
  return content.sections.reduce((acc, section) => {
    return acc + 1 + countChildSections(section);
  }, 0);
}

function countChildSections(section: Section): number {
  if (!section.children) return 0;
  return section.children.reduce((acc, child) => {
    return acc + 1 + countChildSections(child);
  }, 0);
}

function countBlocks(content: ContentTree): number {
  return content.sections.reduce((acc, section) => {
    return acc + (section.blocks?.length || 0) + countChildBlocks(section);
  }, 0);
}

function countChildBlocks(section: Section): number {
  if (!section.children) return 0;
  return section.children.reduce((acc, child) => {
    return acc + (child.blocks?.length || 0) + countChildBlocks(child);
  }, 0);
}

function getVersionDiff(
  current: ContentTree,
  previous: ContentTree
): { added: number; removed: number; modified: number } {
  const currentSections = current.sections.map((s) => s.id);
  const previousSections = previous.sections.map((s) => s.id);

  const added = currentSections.filter((id) => !previousSections.includes(id)).length;
  const removed = previousSections.filter((id) => !currentSections.includes(id)).length;
  const modified = currentSections.filter((id) => {
    if (!previousSections.includes(id)) return false;
    const currSection = current.sections.find((s) => s.id === id);
    const prevSection = previous.sections.find((s) => s.id === id);
    return JSON.stringify(currSection) !== JSON.stringify(prevSection);
  }).length;

  return { added, removed, modified };
}

export function VersionHistoryModal({
  isOpen,
  onClose,
  currentContent,
  pastVersions,
  futureVersions,
  onRestoreVersion,
}: VersionHistoryModalProps) {
  const [selectedVersion, setSelectedVersion] = useState<VersionEntry | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersion, setCompareVersion] = useState<VersionEntry | null>(null);

  // Generate version entries with simulated timestamps
  const versionEntries = useMemo<VersionEntry[]>(() => {
    const entries: VersionEntry[] = [];
    const now = new Date();

    // Add past versions (oldest to newest)
    pastVersions.forEach((version, index) => {
      const minutesAgo = (pastVersions.length - index) * 5;
      entries.push({
        version,
        index,
        type: 'past',
        timestamp: new Date(now.getTime() - minutesAgo * 60 * 1000),
        label: `Version ${index + 1}`,
      });
    });

    // Add current version
    entries.push({
      version: currentContent,
      index: pastVersions.length,
      type: 'current',
      timestamp: now,
      label: 'Version actuelle',
    });

    // Add future versions (if any, from redo)
    futureVersions.forEach((version, index) => {
      entries.push({
        version,
        index: pastVersions.length + 1 + index,
        type: 'future',
        label: `Version future ${index + 1}`,
      });
    });

    return entries.reverse(); // Most recent first
  }, [pastVersions, futureVersions, currentContent]);

  const handleSelectVersion = (entry: VersionEntry) => {
    if (compareMode) {
      if (!selectedVersion) {
        setSelectedVersion(entry);
      } else if (entry.index !== selectedVersion.index) {
        setCompareVersion(entry);
      }
    } else {
      setSelectedVersion(entry);
    }
  };

  const handleRestore = () => {
    if (selectedVersion && selectedVersion.type !== 'current') {
      onRestoreVersion(selectedVersion.version);
      onClose();
    }
  };

  const toggleCompareMode = () => {
    setCompareMode(!compareMode);
    setCompareVersion(null);
    if (!compareMode && !selectedVersion) {
      // Select current version for comparison base
      const currentEntry = versionEntries.find((e) => e.type === 'current');
      setSelectedVersion(currentEntry || null);
    }
  };

  const renderVersionPreview = (entry: VersionEntry) => {
    const sectionCount = countSections(entry.version);
    const blockCount = countBlocks(entry.version);

    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-5 w-5 text-gray-500" />
          <span className="font-medium">{entry.label}</span>
          {entry.type === 'current' && (
            <Badge variant="default" className="bg-green-500">
              Actuel
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Sections:</span>
            <span className="font-medium">{sectionCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Blocs:</span>
            <span className="font-medium">{blockCount}</span>
          </div>
        </div>
        <div className="mt-3 space-y-1">
          {entry.version.sections.slice(0, 3).map((section) => (
            <div
              key={section.id}
              className="text-sm text-gray-600 flex items-center gap-2"
            >
              <ChevronRight className="h-3 w-3" />
              {section.title}
            </div>
          ))}
          {entry.version.sections.length > 3 && (
            <div className="text-sm text-gray-400 italic">
              +{entry.version.sections.length - 3} autres sections
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderComparison = () => {
    if (!selectedVersion || !compareVersion) return null;

    const diff = getVersionDiff(compareVersion.version, selectedVersion.version);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-primary-600" />
            <span className="font-medium text-blue-900">
              Comparaison: {selectedVersion.label} → {compareVersion.label}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCompareVersion(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <Plus className="h-5 w-5 text-primary-600" />
            <div>
              <div className="text-2xl font-bold text-green-700">{diff.added}</div>
              <div className="text-sm text-green-600">Sections ajoutées</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
            <Minus className="h-5 w-5 text-primary-600" />
            <div>
              <div className="text-2xl font-bold text-red-700">{diff.removed}</div>
              <div className="text-sm text-red-600">Sections supprimées</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
            <FileText className="h-5 w-5 text-primary-600" />
            <div>
              <div className="text-2xl font-bold text-yellow-700">{diff.modified}</div>
              <div className="text-sm text-yellow-600">Sections modifiées</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              {selectedVersion.label}
            </h4>
            {renderVersionPreview(selectedVersion)}
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              {compareVersion.label}
            </h4>
            {renderVersionPreview(compareVersion)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des versions
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history">
              <Clock className="h-4 w-4 mr-2" />
              Historique
            </TabsTrigger>
            <TabsTrigger value="compare" onClick={toggleCompareMode}>
              <GitCompare className="h-4 w-4 mr-2" />
              Comparer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Version list */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Versions ({versionEntries.length})
                </h3>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2 pr-4">
                    {versionEntries.map((entry) => (
                      <button
                        key={`${entry.type}-${entry.index}`}
                        onClick={() => handleSelectVersion(entry)}
                        className={cn(
                          'w-full p-3 rounded-lg border text-left transition-colors',
                          selectedVersion?.index === entry.index
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                          entry.type === 'current' && 'border-green-300 bg-green-50/50'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">
                            {entry.label}
                          </span>
                          {entry.type === 'current' && (
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-700"
                            >
                              Actuel
                            </Badge>
                          )}
                          {entry.type === 'future' && (
                            <Badge variant="secondary" className="bg-gray-100">
                              Redo
                            </Badge>
                          )}
                        </div>
                        {entry.timestamp && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(entry.timestamp)}
                          </div>
                        )}
                        <div className="mt-2 text-xs text-gray-500">
                          {countSections(entry.version)} sections •{' '}
                          {countBlocks(entry.version)} blocs
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Version preview */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Aperçu
                </h3>
                {selectedVersion ? (
                  <div className="space-y-4">
                    {renderVersionPreview(selectedVersion)}
                    {selectedVersion.type !== 'current' && (
                      <Button
                        onClick={handleRestore}
                        className="w-full"
                        variant="default"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restaurer cette version
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
                    <Eye className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>Sélectionnez une version pour voir l'aperçu</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="compare" className="mt-4">
            {compareVersion ? (
              renderComparison()
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <GitCompare className="h-4 w-4 inline mr-2" />
                    Sélectionnez deux versions dans la liste pour les comparer.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Version de base
                    </h4>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2 pr-4">
                        {versionEntries.map((entry) => (
                          <button
                            key={`base-${entry.type}-${entry.index}`}
                            onClick={() => setSelectedVersion(entry)}
                            className={cn(
                              'w-full p-3 rounded-lg border text-left transition-colors',
                              selectedVersion?.index === entry.index
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            )}
                          >
                            <span className="font-medium text-sm">
                              {entry.label}
                            </span>
                            {entry.timestamp && (
                              <div className="text-xs text-gray-500 mt-1">
                                {formatTimeAgo(entry.timestamp)}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Comparer avec
                    </h4>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2 pr-4">
                        {versionEntries
                          .filter((e) => e.index !== selectedVersion?.index)
                          .map((entry) => (
                            <button
                              key={`compare-${entry.type}-${entry.index}`}
                              onClick={() => setCompareVersion(entry)}
                              className={cn(
                                'w-full p-3 rounded-lg border text-left transition-colors',
                                compareVersion?.index === entry.index
                                  ? 'border-purple-500 bg-purple-50'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              )}
                            >
                              <span className="font-medium text-sm">
                                {entry.label}
                              </span>
                              {entry.timestamp && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {formatTimeAgo(entry.timestamp)}
                                </div>
                              )}
                            </button>
                          ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
