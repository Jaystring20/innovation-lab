'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StageManager } from './components/stage-manager'
import { TeamRegistrationManager } from './components/team-registration-manager'
import { SubmissionReviewer } from './components/submission-reviewer'
import { ScoringSystem } from './components/scoring-system'

export default function CompetitionModule() {
  const [activeTab, setActiveTab] = useState<string>('stages')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">APEN Competition</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage competition stages, teams, submissions, and scoring
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="stages">Stages</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="scoring">Scoring</TabsTrigger>
        </TabsList>

        <TabsContent value="stages" className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Competition Stages</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create and manage competition stages with timelines and requirements
            </p>
          </div>
          <StageManager />
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Team Registration</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Register teams and manage team members for competitions
            </p>
          </div>
          <TeamRegistrationManager />
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Submission Review</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Review team submissions and provide feedback
            </p>
          </div>
          <SubmissionReviewer />
        </TabsContent>

        <TabsContent value="scoring" className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Scoring System</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Score submissions using rubric criteria and generate rankings
            </p>
          </div>
          <ScoringSystem />
        </TabsContent>
      </Tabs>
    </div>
  )
}
