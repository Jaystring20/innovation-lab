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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Learning Lab</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage learning content, assessments, and missions
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="levels">Levels</TabsTrigger>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="missions">Missions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="levels" className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Level Management</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create and manage learning tiers and stages
            </p>
          </div>
          <LevelEditor />
        </TabsContent>

        <TabsContent value="lessons" className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Lesson Builder</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create rich lesson content with multiple asset types
            </p>
          </div>
          <LessonBuilder />
        </TabsContent>

        <TabsContent value="assessments" className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Assessment Builder</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Design quizzes and assessments with multiple question types
            </p>
          </div>
          <QuizBuilder />
        </TabsContent>

        <TabsContent value="missions" className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Mission Designer</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create practical missions with difficulty levels and XP rewards
            </p>
          </div>
          <MissionDesigner />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Analytics & Insights</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Monitor student progress, engagement, and completion rates
            </p>
          </div>
          <AnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}
