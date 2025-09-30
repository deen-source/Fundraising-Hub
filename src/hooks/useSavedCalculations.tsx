import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useSavedCalculations = (toolType: string) => {
  const [savedCalculations, setSavedCalculations] = useState<any[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [currentCalcId, setCurrentCalcId] = useState<string | null>(null);

  useEffect(() => {
    loadSavedCalculations();
  }, [toolType]);

  const loadSavedCalculations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('saved_calculations')
      .select('*')
      .eq('user_id', user.id)
      .eq('tool_type', toolType)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSavedCalculations(data);
    }
  };

  const handleSave = async (calculationData: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in to save calculations');
      return false;
    }

    if (currentCalcId) {
      const { error } = await supabase
        .from('saved_calculations')
        .update({ calculation_data: calculationData, title: saveTitle })
        .eq('id', currentCalcId);

      if (error) {
        toast.error('Failed to update calculation');
        return false;
      }
      toast.success('Calculation updated');
    } else {
      const { error } = await supabase
        .from('saved_calculations')
        .insert({
          user_id: user.id,
          tool_type: toolType,
          title: saveTitle || `${toolType} - ${new Date().toLocaleDateString()}`,
          calculation_data: calculationData
        });

      if (error) {
        toast.error('Failed to save calculation');
        return false;
      }
      toast.success('Calculation saved');
    }

    setSaveDialogOpen(false);
    setSaveTitle('');
    loadSavedCalculations();
    return true;
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('saved_calculations')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete calculation');
      return;
    }
    toast.success('Calculation deleted');
    loadSavedCalculations();
  };

  return {
    savedCalculations,
    saveDialogOpen,
    setSaveDialogOpen,
    loadDialogOpen,
    setLoadDialogOpen,
    saveTitle,
    setSaveTitle,
    currentCalcId,
    setCurrentCalcId,
    handleSave,
    handleDelete,
    loadSavedCalculations
  };
};
