'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StageManager } from './components/stage-manager'
import { TeamRegistrationManager } from './components/team-registration-manager'
import { SubmissionReviewer } from './components/submission-reviewer'
import { ScoringSystem } from './components/scoring-system'
import JudgeAssignmentManager from './components/judge-assignment-manager'

export default function CompetitionModule() {
  const [activeTab, setActiveTab] = useState<string>('stages')

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Competition</h1>
          <p className="text-muted-foreground mt-2">
            Manage stages, teams, submissions, and scoring
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
          <TabsList className="grid w-full grid-cols-5 bg-muted/30">
            <TabsTrigger value="stages">Stages</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="scoring">Scoring</TabsTrigger>
            <TabsTrigger value="judges">Judges</TabsTrigger>
          </TabsList>

          <TabsContent value="stages" className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                Competition Stages
              </h2>
              <p className="text-muted-foreground">
                Create and manage competition stages with timelines and requirements
              </p>
            </div>
            <StageManager />
          </TabsContent>

          <TabsContent value="teams" className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                Team Registration
              </h2>
              <p className="text-muted-foreground">
                Register teams and manage team members for competitions
              </p>
            </div>
            <TeamRegistrationManager />
          </TabsContent>

          <TabsContent value="submissions" className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                Submission Review
              </h2>
              <p className="text-muted-foreground">
                Review team submissions and provide feedback
              </p>
            </div>
            <SubmissionReviewer />
          </TabsContent>

          <TabsContent value="scoring" className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                Scoring System
              </h2>
              <p className="text-muted-foreground">
                Score submissions using rubric criteria and generate rankings
              </p>
            </div>
            <ScoringSystem />
          </TabsContent>

          <TabsContent value="judges" className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                Judge Management
              </h2>
              <p className="text-muted-foreground">
                Manage judges and assign them to submissions
              </p>
              <Link href="/modules/competition/judges" className="text-accent hover:text-accent/80 font-medium text-sm inline-flex items-center gap-1 mt-3">
                View detailed judge dashboard →
              </Link>
            </div>
            <JudgeAssignmentManager submissions={[]} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
