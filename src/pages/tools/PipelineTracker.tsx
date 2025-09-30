import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { ArrowLeft, Plus, TrendingUp, Mail, Linkedin, Building2, DollarSign, Calendar, Target } from 'lucide-react';

interface Investor {
  id: string;
  name: string;
  firm_name: string;
  email: string;
  linkedin_url: string;
  pipeline_stage: string;
  priority: string;
  check_size_min: number | null;
  check_size_max: number | null;
  last_contact_date: string | null;
  next_follow_up_date: string | null;
  fit_score: number | null;
}

const PIPELINE_STAGES = [
  { id: 'research', name: 'Research', color: 'bg-slate-500' },
  { id: 'outreach', name: 'Outreach', color: 'bg-blue-500' },
  { id: 'in_conversation', name: 'In Conversation', color: 'bg-purple-500' },
  { id: 'meeting_scheduled', name: 'Meeting Scheduled', color: 'bg-indigo-500' },
  { id: 'pitch_sent', name: 'Pitch Sent', color: 'bg-cyan-500' },
  { id: 'due_diligence', name: 'Due Diligence', color: 'bg-orange-500' },
  { id: 'committed', name: 'Committed', color: 'bg-green-500' },
  { id: 'passed', name: 'Passed', color: 'bg-red-500' },
];

const PipelineTracker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-300 text-red-700 bg-red-50';
      case 'medium': return 'border-yellow-300 text-yellow-700 bg-yellow-50';
      case 'low': return 'border-green-300 text-green-700 bg-green-50';
      default: return 'border-gray-300 text-gray-700 bg-gray-50';
    }
  };

  const formatCheckSize = (min: number | null, max: number | null) => {
    if (!min && !max) return 'N/A';
    if (min && max) return `$${(min / 1000).toFixed(0)}K - $${(max / 1000).toFixed(0)}K`;
    if (min) return `$${(min / 1000).toFixed(0)}K+`;
    if (max) return `Up to $${(max / 1000).toFixed(0)}K`;
    return 'N/A';
  };

  const filteredInvestors = investors.filter(investor => {
    const matchesSearch = searchQuery === '' || 
      investor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      investor.firm_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || investor.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const totalInvestors = investors.length;
  const activeConversations = investors.filter(i => i.pipeline_stage === 'in_conversation').length;
  const committed = investors.filter(i => i.pipeline_stage === 'committed').length;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-3xl font-bold">Investor Pipeline</h1>
                <p className="text-muted-foreground">Track and manage your fundraising process</p>
              </div>
              <Button onClick={() => navigate('/investor-crm')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Investor
              </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search investors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              <div className="flex gap-4 overflow-x-auto pb-4">
                {PIPELINE_STAGES.map(stage => {
                  const stageInvestors = filteredInvestors.filter(inv => inv.pipeline_stage === stage.id);
                  return (
                    <div key={stage.id} className="flex flex-col min-w-[320px]">
                      <div className={`${stage.color} text-white p-3 rounded-t-lg font-semibold flex items-center justify-between`}>
                        <span>{stage.name}</span>
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                          {stageInvestors.length}
                        </Badge>
                      </div>
                      <Droppable droppableId={stage.id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`flex-1 p-3 border-x border-b rounded-b-lg min-h-[500px] space-y-3 ${
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
                                    className={`p-4 cursor-move transition-all ${
                                      snapshot.isDragging ? 'shadow-lg ring-2 ring-primary rotate-2' : 'hover:shadow-md'
                                    }`}
                                  >
                                    <div className="space-y-3">
                                      <div>
                                        <p className="font-semibold text-sm mb-1">{investor.name}</p>
                                        {investor.firm_name && (
                                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Building2 className="h-3 w-3" />
                                            {investor.firm_name}
                                          </div>
                                        )}
                                      </div>

                                      {investor.priority && (
                                        <Badge variant="outline" className={getPriorityColor(investor.priority)}>
                                          {investor.priority}
                                        </Badge>
                                      )}

                                      <div className="space-y-2 text-xs">
                                        {(investor.check_size_min || investor.check_size_max) && (
                                          <div className="flex items-center gap-1 text-muted-foreground">
                                            <DollarSign className="h-3 w-3" />
                                            {formatCheckSize(investor.check_size_min, investor.check_size_max)}
                                          </div>
                                        )}
                                        
                                        {investor.fit_score && (
                                          <div className="flex items-center gap-1 text-muted-foreground">
                                            <Target className="h-3 w-3" />
                                            Fit Score: {investor.fit_score}%
                                          </div>
                                        )}

                                        {investor.next_follow_up_date && (
                                          <div className="flex items-center gap-1 text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(investor.next_follow_up_date).toLocaleDateString()}
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex gap-2 pt-2 border-t">
                                        {investor.email && (
                                          <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
                                            <a href={`mailto:${investor.email}`}>
                                              <Mail className="h-3 w-3" />
                                            </a>
                                          </Button>
                                        )}
                                        {investor.linkedin_url && (
                                          <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
                                            <a href={investor.linkedin_url} target="_blank" rel="noopener noreferrer">
                                              <Linkedin className="h-3 w-3" />
                                            </a>
                                          </Button>
                                        )}
                                      </div>
                                    </div>
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
