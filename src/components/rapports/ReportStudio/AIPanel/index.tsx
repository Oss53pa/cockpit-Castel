import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Lightbulb,
  TrendingUp,
  Activity,
  MessageCircle,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  CheckCircle,
  User,
  Bot,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type {
  AITabType,
  AIMessage,
  Insight,
  Recommendation,
  ReportComment,
  ReportActivity,
} from '@/types/reportStudio';

interface AIPanelProps {
  isOpen: boolean;
  activeTab: AITabType;
  isLoading: boolean;
  chatMessages: AIMessage[];
  insights: Insight[];
  recommendations: Recommendation[];
  comments: ReportComment[];
  activities: ReportActivity[];
  reportSummary?: string;
  onToggle: () => void;
  onSetTab: (tab: AITabType) => void;
  onSendMessage: (message: string) => void;
  onResolveComment: (commentId: number) => void;
}

const tabs: { id: AITabType; icon: React.ReactNode; label: string }[] = [
  { id: 'resume', icon: <Sparkles className="h-5 w-5" />, label: 'Résumé' },
  { id: 'insights', icon: <Lightbulb className="h-5 w-5" />, label: 'Insights' },
  { id: 'actions', icon: <TrendingUp className="h-5 w-5" />, label: 'Actions' },
  { id: 'activity', icon: <Activity className="h-5 w-5" />, label: 'Activité' },
  { id: 'comments', icon: <MessageCircle className="h-5 w-5" />, label: 'Commentaires' },
  { id: 'chat', icon: <MessageSquare className="h-5 w-5" />, label: 'Chat' },
];

export function AIPanel({
  isOpen,
  activeTab,
  isLoading,
  chatMessages,
  insights,
  recommendations,
  comments,
  activities,
  reportSummary,
  onToggle,
  onSetTab,
  onSendMessage,
  onResolveComment,
}: AIPanelProps) {
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim());
    setChatInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="w-12 h-full bg-white border-l flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 w-8 p-0"
          title="Afficher le panneau IA"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="mt-4 flex flex-col items-center gap-2">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              onClick={() => {
                onToggle();
                onSetTab(tab.id);
              }}
              className={cn(
                'h-10 w-10 p-0',
                activeTab === tab.id && 'bg-blue-100 text-blue-700'
              )}
              title={tab.label}
            >
              {tab.icon}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'resume':
        return (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-blue-700">
              <Sparkles className="h-5 w-5" />
              <h3 className="font-semibold">Résumé du rapport</h3>
            </div>
            {reportSummary ? (
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {reportSummary}
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Sparkles className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  Le résumé sera généré automatiquement une fois le rapport
                  suffisamment complété.
                </p>
                <Button variant="outline" size="sm" className="mt-4" disabled={isLoading}>
                  <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
                  Générer le résumé
                </Button>
              </div>
            )}
          </div>
        );

      case 'insights':
        return (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-yellow-700">
                <Lightbulb className="h-5 w-5" />
                <h3 className="font-semibold">Insights</h3>
              </div>
              <Badge variant="secondary">{insights.length}</Badge>
            </div>
            {insights.length > 0 ? (
              <div className="space-y-3">
                {insights.map((insight) => (
                  <div
                    key={insight.id}
                    className={cn(
                      'p-3 rounded-lg border',
                      insight.severity === 'critical' && 'bg-red-50 border-red-200',
                      insight.severity === 'warning' && 'bg-yellow-50 border-yellow-200',
                      insight.severity === 'info' && 'bg-blue-50 border-blue-200'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {insight.severity === 'critical' && (
                        <AlertTriangle className="h-4 w-4 text-primary-600 mt-0.5" />
                      )}
                      {insight.severity === 'warning' && (
                        <AlertTriangle className="h-4 w-4 text-primary-600 mt-0.5" />
                      )}
                      {insight.severity === 'info' && (
                        <Lightbulb className="h-4 w-4 text-primary-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {insight.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Lightbulb className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  Les insights seront générés automatiquement en analysant les
                  données du rapport.
                </p>
              </div>
            )}
          </div>
        );

      case 'actions':
        return (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-700">
                <TrendingUp className="h-5 w-5" />
                <h3 className="font-semibold">Recommandations</h3>
              </div>
              <Badge variant="secondary">{recommendations.length}</Badge>
            </div>
            {recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-lg border bg-green-50 border-green-200"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {rec.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {rec.description}
                        </p>
                        {rec.suggestedAction && (
                          <p className="text-xs text-green-700 mt-2 font-medium">
                            Action suggérée : {rec.suggestedAction}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={
                          rec.priority === 'high'
                            ? 'destructive'
                            : rec.priority === 'medium'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {rec.priority === 'high'
                          ? 'Haute'
                          : rec.priority === 'medium'
                          ? 'Moyenne'
                          : 'Basse'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  Les recommandations apparaîtront ici une fois le rapport
                  analysé.
                </p>
              </div>
            )}
          </div>
        );

      case 'activity':
        return (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-purple-700">
              <Activity className="h-5 w-5" />
              <h3 className="font-semibold">Historique d'activité</h3>
            </div>
            {activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-2 rounded hover:bg-gray-50"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {activity.userName} • {formatDate(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  Aucune activité pour le moment.
                </p>
              </div>
            )}
          </div>
        );

      case 'comments':
        return (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-orange-700">
                <MessageCircle className="h-5 w-5" />
                <h3 className="font-semibold">Commentaires</h3>
              </div>
              <Badge variant="secondary">
                {comments.filter((c) => !c.isResolved).length}
              </Badge>
            </div>
            {comments.length > 0 ? (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={cn(
                      'p-3 rounded-lg border',
                      comment.isResolved
                        ? 'bg-gray-50 border-gray-200 opacity-60'
                        : 'bg-orange-50 border-orange-200'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {comment.authorName}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                      {!comment.isResolved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onResolveComment(comment.id!)}
                          className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {comment.isResolved && (
                      <p className="text-xs text-gray-400 mt-2">
                        Résolu par {comment.resolvedBy} le{' '}
                        {formatDate(comment.resolvedAt!)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Aucun commentaire.</p>
              </div>
            )}
          </div>
        );

      case 'chat':
        return (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 p-4 border-b text-indigo-700">
              <MessageSquare className="h-5 w-5" />
              <h3 className="font-semibold">Assistant IA</h3>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {chatMessages.length > 0 ? (
                  chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'flex gap-3',
                        message.role === 'user' ? 'flex-row-reverse' : ''
                      )}
                    >
                      <div
                        className={cn(
                          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                          message.role === 'user'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        )}
                      >
                        {message.role === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div
                        className={cn(
                          'flex-1 max-w-[80%] rounded-lg p-3',
                          message.role === 'user'
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-gray-100 text-gray-900'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {formatDate(message.timestamp)}
                          </span>
                          {message.role === 'assistant' && (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                              >
                                <ThumbsUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                              >
                                <ThumbsDown className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Bot className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 mb-2">
                      Bonjour ! Je suis votre assistant IA.
                    </p>
                    <p className="text-xs text-gray-400">
                      Posez-moi des questions sur les données de votre rapport.
                    </p>
                  </div>
                )}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0.2s' }}
                        />
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0.4s' }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Posez votre question..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || isLoading}
                  className="px-3"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {[
                  'Résume les KPIs',
                  'Quels sont les risques ?',
                  'Tendances du NOI',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setChatInput(suggestion)}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-96 h-full bg-white border-l flex">
      {/* Tabs sidebar */}
      <div className="w-14 border-r bg-gray-50 flex flex-col items-center py-3 gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 w-8 p-0 mb-2"
          title="Masquer le panneau"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            size="sm"
            onClick={() => onSetTab(tab.id)}
            className={cn(
              'h-10 w-10 p-0 relative',
              activeTab === tab.id && 'bg-white text-blue-700 shadow-sm'
            )}
            title={tab.label}
          >
            {tab.icon}
            {tab.id === 'comments' && comments.filter((c) => !c.isResolved).length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                {comments.filter((c) => !c.isResolved).length}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'chat' ? (
          renderTabContent()
        ) : (
          <ScrollArea className="flex-1">{renderTabContent()}</ScrollArea>
        )}
      </div>
    </div>
  );
}
