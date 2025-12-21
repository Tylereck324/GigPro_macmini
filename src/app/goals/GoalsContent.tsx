'use client';

import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Button, Card } from '@/components/ui';
import { GoalForm } from '@/components/goals/GoalForm';
import { GoalList } from '@/components/goals/GoalList';
import { GoalProgressCard } from '@/components/goals/GoalProgressCard';
import { useGoalStore, useIncomeStore } from '@/store';
import {
  calculateGoalProgress,
  calculatePrioritizedGoalProgress,
} from '@/lib/utils/goalCalculations';
import { format } from 'date-fns';
import type { Goal, CreateGoal } from '@/types/goal';
import { ConfirmDialog } from '@/components/ui';

export function GoalsContent() {
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { goals, loadGoals, addGoal, updateGoal, deleteGoal } = useGoalStore();
  const { incomeEntries, loadIncomeEntries } = useIncomeStore();

  useEffect(() => {
    void loadGoals().catch(() => {});
    void loadIncomeEntries().catch(() => {});
  }, [loadGoals, loadIncomeEntries]);

  // Calculate progress for weekly goals (normal calculation)
  const weeklyGoalsWithProgress = useMemo(() => {
    return goals
      .filter((g) => g.period === 'weekly')
      .map((goal) => calculateGoalProgress(goal, incomeEntries));
  }, [goals, incomeEntries]);

  // Calculate progress for monthly goals (prioritized allocation)
  const monthlyGoalsWithProgress = useMemo(() => {
    return calculatePrioritizedGoalProgress(goals, incomeEntries);
  }, [goals, incomeEntries]);

  // Combine all goals for the list view
  const goalsWithProgress = useMemo(() => {
    return [...weeklyGoalsWithProgress, ...monthlyGoalsWithProgress];
  }, [weeklyGoalsWithProgress, monthlyGoalsWithProgress]);

  // Get current week and month progress
  const today = format(new Date(), 'yyyy-MM-dd');
  const currentWeekProgress = weeklyGoalsWithProgress.find(
    (gp) =>
      gp.goal.startDate <= today &&
      gp.goal.endDate >= today &&
      gp.goal.isActive
  );

  // Get all active current month goals sorted by priority
  const currentMonthGoals = monthlyGoalsWithProgress.filter(
    (gp) =>
      gp.goal.startDate <= today &&
      gp.goal.endDate >= today &&
      gp.goal.isActive
  );

  const handleSaveGoal = async (data: CreateGoal) => {
    try {
      if (editingGoal) {
        await updateGoal(editingGoal.id, data);
        toast.success('Goal updated!');
        setEditingGoal(null);
        setShowForm(false);
      } else {
        await addGoal(data);
        toast.success('Goal added!');
        // Keep form open for multiple additions
      }
    } catch (error) {
      throw error;
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteGoal = async (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await deleteGoal(deleteId);
      toast.success('Goal deleted');
      setDeleteId(null);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await updateGoal(id, { isActive });
    toast.success(isActive ? 'Goal activated' : 'Goal deactivated');
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingGoal(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-2">Income Goals</h1>
        <p className="text-textSecondary">
          Set and track your weekly and monthly income goals
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Forms and List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Back Button */}
          {showForm && (
            <Button variant="outline" onClick={handleCancelForm}>
              ← Back to Goals
            </Button>
          )}

          {/* Add Button */}
          {!showForm && (
            <Button variant="primary" onClick={() => setShowForm(true)}>
              + Add New Goal
            </Button>
          )}

          {/* Form */}
          {showForm && (
            <GoalForm
              initialData={editingGoal ?? undefined}
              onSave={handleSaveGoal}
              onCancel={handleCancelForm}
            />
          )}

          {/* Goals List */}
          {!showForm && (
            <GoalList
              goals={goalsWithProgress}
              onEdit={handleEditGoal}
              onDelete={handleDeleteGoal}
              onToggleActive={handleToggleActive}
            />
          )}
        </div>

        {/* Right Column - Current Progress */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-4">
            <h2 className="text-xl font-semibold text-text mb-4">
              Current Progress
            </h2>

            {currentWeekProgress ? (
              <GoalProgressCard
                progress={currentWeekProgress}
                periodLabel="This Week"
                onEdit={handleEditGoal}
                onDelete={handleDeleteGoal}
                onToggleActive={handleToggleActive}
              />
            ) : (
              <Card className="p-4 text-center text-textSecondary">
                No active weekly goal
              </Card>
            )}

            {currentMonthGoals.length > 0 ? (
              currentMonthGoals.map((progress) => (
                <GoalProgressCard
                  key={progress.goal.id}
                  progress={progress}
                  periodLabel="This Month"
                  onEdit={handleEditGoal}
                  onDelete={handleDeleteGoal}
                  onToggleActive={handleToggleActive}
                />
              ))
            ) : (
              <Card className="p-4 text-center text-textSecondary">
                No active monthly goals
              </Card>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Goal"
        message="Are you sure you want to delete this goal? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
