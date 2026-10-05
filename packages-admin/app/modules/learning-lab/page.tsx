'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LevelEditor } from './components/level-editor'
import { LessonBuilder } from './components/lesson-builder'
import { QuizBuilder } from './components/quiz-builder'
import { MissionDesigner } from './components/mission-designer'
import { AnalyticsDashboard } from './components/analytics-dashboard'

export default function LearningLabModule() {
  const [activeTab, setActiveTab] = useState<string>('levels')

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Learning Lab</h1>
          <p className="text-muted-foreground mt-2">
            Manage levels, lessons, assessments, and missions
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
          <TabsList className="grid w-full grid-cols-5 bg-muted/30">
            <TabsTrigger value="levels">Levels</TabsTrigger>
            <TabsTrigger value="lessons">Lessons</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="missions">Missions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="levels" className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                Level Management
              </h2>
              <p className="text-muted-foreground">
                Create and manage learning tiers and stages
              </p>
            </div>
            <LevelEditor />
          </TabsContent>

          <TabsContent value="lessons" className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                Lesson Builder
              </h2>
              <p className="text-muted-foreground">
                Create rich lesson content with multiple asset types
              </p>
            </div>
            <LessonBuilder />
          </TabsContent>

          <TabsContent value="assessments" className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                Assessment Builder
              </h2>
              <p className="text-muted-foreground">
                Design quizzes and assessments with multiple question types
              </p>
            </div>
            <QuizBuilder />
          </TabsContent>

          <TabsContent value="missions" className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                Mission Designer
              </h2>
              <p className="text-muted-foreground">
                Create practical missions with difficulty levels and XP rewards
              </p>
            </div>
            <MissionDesigner />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                Analytics & Insights
              </h2>
              <p className="text-muted-foreground">
                Monitor student progress, engagement, and completion rates
              </p>
            </div>
            <AnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
