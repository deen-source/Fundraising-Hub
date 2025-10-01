import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  Mail, 
  Linkedin, 
  DollarSign, 
  Star, 
  Calendar,
  User,
  ExternalLink
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Investor {
  id: string;
  name: string;
  firm_name: string | null;
  email: string | null;
  website: string | null;
  linkedin_url: string | null;
  pipeline_stage: string;
  priority: string;
  check_size_min: number | null;
  check_size_max: number | null;
  fit_score: number | null;
  next_follow_up_date: string | null;
  contact_person: string | null;
  tags: string[] | null;
}

interface InvestorKanbanProps {
  investors: Investor[];
  onInvestorClick: (investor: Investor) => void;
  onRefresh: () => void;
}

const PIPELINE_STAGES = [
  { id: 'research', title: 'Research', color: 'bg-slate-100 dark:bg-slate-900', borderColor: 'border-slate-300' },
  { id: 'target', title: 'Target', color: 'bg-blue-50 dark:bg-blue-950', borderColor: 'border-blue-300' },
  { id: 'outreach', title: 'Outreach', color: 'bg-purple-50 dark:bg-purple-950', borderColor: 'border-purple-300' },
  { id: 'engaged', title: 'Engaged', color: 'bg-yellow-50 dark:bg-yellow-950', borderColor: 'border-yellow-300' },
  { id: 'meeting', title: 'Meeting', color: 'bg-orange-50 dark:bg-orange-950', borderColor: 'border-orange-300' },
  { id: 'due_diligence', title: 'Due Diligence', color: 'bg-green-50 dark:bg-green-950', borderColor: 'border-green-300' },
  { id: 'term_sheet', title: 'Term Sheet', color: 'bg-emerald-50 dark:bg-emerald-950', borderColor: 'border-emerald-300' },
  { id: 'closed', title: 'Closed', color: 'bg-green-100 dark:bg-green-900', borderColor: 'border-green-400' },
  { id: 'passed', title: 'Passed', color: 'bg-red-50 dark:bg-red-950', borderColor: 'border-red-300' },
];

export const InvestorKanban = ({ investors, onInvestorClick, onRefresh }: InvestorKanbanProps) => {
  const { toast } = useToast();
  const [localInvestors, setLocalInvestors] = useState(investors);

  useEffect(() => {
    setLocalInvestors(investors);
  }, [investors]);

  useEffect(() => {
    // Subscribe to realtime changes
    const channel = supabase
      .channel('investors-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'investors'
        },
        () => {
          onRefresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onRefresh]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStage = destination.droppableId;
    const investorId = draggableId;

    // Optimistic update
    setLocalInvestors(prev =>
      prev.map(inv =>
        inv.id === investorId ? { ...inv, pipeline_stage: newStage } : inv
      )
    );

    try {
      const { error } = await supabase
        .from('investors')
        .update({ pipeline_stage: newStage })
        .eq('id', investorId);

      if (error) throw error;

      toast({
        title: 'Pipeline updated',
        description: `Moved to ${PIPELINE_STAGES.find(s => s.id === newStage)?.title}`,
      });
    } catch (error) {
      console.error('Error updating pipeline stage:', error);
      // Revert optimistic update
      setLocalInvestors(investors);
      toast({
        title: 'Error',
        description: 'Failed to update pipeline stage',
        variant: 'destructive',
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-300';
    }
  };

  const formatCheckSize = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `$${min / 1000}K - $${max / 1000}K`;
    if (min) return `$${min / 1000}K+`;
    if (max) return `Up to $${max / 1000}K`;
  };

  const getInvestorsByStage = (stageId: string) => {
    return localInvestors.filter(inv => inv.pipeline_stage === stageId);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map(stage => {
          const stageInvestors = getInvestorsByStage(stage.id);
          
          return (
            <div key={stage.id} className="flex-shrink-0 w-80">
              <div className={`${stage.color} rounded-lg border-2 ${stage.borderColor} p-3 mb-3`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{stage.title}</h3>
                  <Badge variant="secondary">{stageInvestors.length}</Badge>
                </div>
              </div>

              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-3 min-h-[200px] rounded-lg p-2 transition-colors ${
                      snapshot.isDraggingOver ? 'bg-accent/50' : 'bg-transparent'
                    }`}
                  >
                    {stageInvestors.map((investor, index) => (
                      <Draggable
                        key={investor.id}
                        draggableId={investor.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`cursor-pointer hover:shadow-lg transition-all border-l-4 ${getPriorityColor(
                              investor.priority
                            )} ${snapshot.isDragging ? 'shadow-2xl rotate-2' : ''}`}
                            onClick={() => onInvestorClick(investor)}
                          >
                            <CardContent className="p-4 space-y-3">
                              {/* Investor Name & Firm */}
                              <div>
                                <div className="font-semibold text-sm line-clamp-1" title={investor.name}>
                                  {investor.name}
                                </div>
                                {investor.firm_name && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                    <Building2 className="h-3 w-3" />
                                    <span className="line-clamp-1">{investor.firm_name}</span>
                                  </div>
                                )}
                              </div>

                              {/* Contact Person */}
                              {investor.contact_person && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <User className="h-3 w-3" />
                                  <span className="line-clamp-1">{investor.contact_person}</span>
                                </div>
                              )}

                              {/* Check Size */}
                              {(investor.check_size_min || investor.check_size_max) && (
                                <div className="flex items-center gap-1 text-xs">
                                  <DollarSign className="h-3 w-3 text-green-600" />
                                  <span>{formatCheckSize(investor.check_size_min, investor.check_size_max)}</span>
                                </div>
                              )}

                              {/* Fit Score */}
                              {investor.fit_score !== null && (
                                <div className="flex items-center gap-1 text-xs">
                                  <Star className="h-3 w-3 text-yellow-500" />
                                  <span>Fit: {investor.fit_score}/100</span>
                                </div>
                              )}

                              {/* Next Follow-up */}
                              {investor.next_follow_up_date && (
                                <div className="flex items-center gap-1 text-xs">
                                  <Calendar className="h-3 w-3 text-blue-500" />
                                  <span>
                                    {new Date(investor.next_follow_up_date) < new Date() ? (
                                      <span className="text-red-500 font-semibold">Overdue</span>
                                    ) : (
                                      new Date(investor.next_follow_up_date).toLocaleDateString()
                                    )}
                                  </span>
                                </div>
                              )}

                              {/* Tags */}
                              {investor.tags && investor.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {investor.tags.slice(0, 2).map((tag, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {investor.tags.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{investor.tags.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {/* Action Icons */}
                              <div className="flex gap-2 pt-2 border-t">
                                {investor.email && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.location.href = `mailto:${investor.email}`;
                                          }}
                                        >
                                          <Mail className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Email</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {investor.linkedin_url && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(investor.linkedin_url!, '_blank');
                                          }}
                                        >
                                          <Linkedin className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>LinkedIn</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {investor.website && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(investor.website!, '_blank');
                                          }}
                                        >
                                          <ExternalLink className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Website</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {stageInvestors.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        Drag investors here
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};
