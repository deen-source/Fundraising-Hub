import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { ArrowLeft, Plus, TrendingUp } from 'lucide-react';

interface Investor {
  id: string;
  name: string;
  firm_name: string;
  pipeline_stage: string;
  priority: string;
  check_size_min: number | null;
  check_size_max: number | null;
  last_contact_date: string | null;
  next_follow_up_date: string | null;
  fit_score: number | null;
}

const PIPELINE_STAGES = [
  { id: 'research', name: 'Research', color: 'bg-gray-500' },
  { id: 'outreach', name: 'Outreach', color: 'bg-blue-500' },
  { id: 'in_conversation', name: 'In Conversation', color: 'bg-yellow-500' },
  { id: 'due_diligence', name: 'Due Diligence', color: 'bg-orange-500' },
  { id: 'committed', name: 'Committed', color: 'bg-green-500' },
  { id: 'passed', name: 'Passed', color: 'bg-red-500' },
];

const PipelineTracker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInvestors();
  }, []);

  const loadInvestors = async () => {
    try {
      const { data, error } = await supabase
        .from('investors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvestors(data || []);
    } catch (error) {
      console.error('Error loading investors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load investors',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const investorId = result.draggableId;
    const newStage = result.destination.droppableId;

    try {
      const { error } = await supabase
        .from('investors')
        .update({ pipeline_stage: newStage })
        .eq('id', investorId);

      if (error) throw error;

      setInvestors(prevInvestors =>
        prevInvestors.map(inv =>
          inv.id === investorId ? { ...inv, pipeline_stage: newStage } : inv
        )
      );

      toast({
        title: 'Pipeline Updated',
        description: 'Investor moved successfully',
      });
    } catch (error) {
      console.error('Error updating pipeline:', error);
      toast({
        title: 'Error',
        description: 'Failed to update pipeline',
        variant: 'destructive',
      });
    }
  };

  const getInvestorsByStage = (stage: string) => {
    return investors.filter(inv => inv.pipeline_stage === stage);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatCheckSize = (min: number | null, max: number | null) => {
    if (!min && !max) return 'N/A';
    if (min && max) return `$${(min / 1000).toFixed(0)}K - $${(max / 1000).toFixed(0)}K`;
    if (min) return `$${(min / 1000).toFixed(0)}K+`;
    if (max) return `Up to $${(max / 1000).toFixed(0)}K`;
    return 'N/A';
  };

  const totalInvestors = investors.length;
  const activeConversations = investors.filter(i => i.pipeline_stage === 'in_conversation').length;
  const committed = investors.filter(i => i.pipeline_stage === 'committed').length;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">Investor Pipeline Tracker</h1>
              <p className="text-muted-foreground">Visual pipeline management for your fundraising</p>
            </div>
            <Button onClick={() => navigate('/investor-crm')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Investor
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Investors</CardDescription>
                <CardTitle className="text-3xl">{totalInvestors}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Active Conversations</CardDescription>
                <CardTitle className="text-3xl">{activeConversations}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Committed</CardDescription>
                <CardTitle className="text-3xl text-green-600">{committed}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Pipeline Board */}
          {isLoading ? (
            <div className="text-center py-12">Loading pipeline...</div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {PIPELINE_STAGES.map(stage => {
                  const stageInvestors = getInvestorsByStage(stage.id);
                  return (
                    <div key={stage.id} className="flex flex-col">
                      <div className={`${stage.color} text-white p-3 rounded-t-lg font-semibold`}>
                        <div className="flex justify-between items-center">
                          <span>{stage.name}</span>
                          <Badge variant="secondary" className="bg-white/20 text-white">
                            {stageInvestors.length}
                          </Badge>
                        </div>
                      </div>
                      <Droppable droppableId={stage.id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`flex-1 p-2 border-x border-b rounded-b-lg min-h-[400px] ${
                              snapshot.isDraggingOver ? 'bg-accent' : 'bg-card'
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
                                    className={`mb-2 cursor-move hover:shadow-md transition-shadow ${
                                      snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                                    }`}
                                    onClick={() => navigate('/investor-crm')}
                                  >
                                    <CardHeader className="p-3">
                                      <CardTitle className="text-sm font-semibold">
                                        {investor.name}
                                      </CardTitle>
                                      {investor.firm_name && (
                                        <CardDescription className="text-xs">
                                          {investor.firm_name}
                                        </CardDescription>
                                      )}
                                    </CardHeader>
                                    <CardContent className="p-3 pt-0 space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Badge
                                          variant="outline"
                                          className={`text-xs ${getPriorityColor(investor.priority)}`}
                                        >
                                          {investor.priority}
                                        </Badge>
                                        {investor.fit_score && (
                                          <Badge variant="outline" className="text-xs">
                                            <TrendingUp className="h-3 w-3 mr-1" />
                                            {investor.fit_score}%
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {formatCheckSize(investor.check_size_min, investor.check_size_max)}
                                      </div>
                                      {investor.next_follow_up_date && (
                                        <div className="text-xs text-muted-foreground">
                                          Follow-up: {new Date(investor.next_follow_up_date).toLocaleDateString()}
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
              </div>
            </DragDropContext>
          )}
        </div>
      </div>
    </AuthGuard>
  );
};

export default PipelineTracker;
