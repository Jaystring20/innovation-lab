#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sctsrxuquhzdjjnlsqbm.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Ci09czHBOmFNcIz-ib672g_79IixEfA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedData() {
  console.log('🌱 Seeding database...\n');

  try {
    // Seed learning_paths
    console.log('📚 Seeding learning_paths...');
    const learningPaths = [
      { title: 'Introduction to Robotics', tier: 'Primary', status: 'active', order_index: 1 },
      { title: 'Advanced Arduino Programming', tier: 'Secondary', status: 'active', order_index: 2 },
      { title: 'IoT & Smart Devices', tier: 'Secondary', status: 'active', order_index: 3 },
      { title: 'Machine Learning Basics', tier: 'Sixth Form', status: 'active', order_index: 4 },
    ];

    for (const path of learningPaths) {
      await supabase.from('learning_paths').insert([
        {
          ...path,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ]);
    }
    console.log(`✅ Created ${learningPaths.length} learning paths\n`);

    // Seed profiles (students)
    console.log('👥 Seeding student profiles...');
    const students = [
      { email: 'alice.johnson@school.com', name: 'Alice Johnson', role: 'student', tier: 'Primary' },
      { email: 'bob.smith@school.com', name: 'Bob Smith', role: 'student', tier: 'Primary' },
      { email: 'charlie.brown@school.com', name: 'Charlie Brown', role: 'student', tier: 'Secondary' },
      { email: 'diana.prince@school.com', name: 'Diana Prince', role: 'student', tier: 'Secondary' },
      { email: 'eve.taylor@school.com', name: 'Eve Taylor', role: 'student', tier: 'Sixth Form' },
      { email: 'frank.wilson@school.com', name: 'Frank Wilson', role: 'student', tier: 'Secondary' },
      { email: 'grace.lee@school.com', name: 'Grace Lee', role: 'student', tier: 'Sixth Form' },
      { email: 'henry.davis@school.com', name: 'Henry Davis', role: 'student', tier: 'Primary' },
    ];

    for (const student of students) {
      await supabase.from('profiles').insert([
        {
          ...student,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ]);
    }
    console.log(`✅ Created ${students.length} student profiles\n`);

    // Seed competitions
    console.log('🏆 Seeding competitions...');
    const competitions = [
      {
        title: 'APEN 2024 Regional Competition',
        status: 'active',
        start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        tier: 'Secondary',
      },
      {
        title: 'Robotics Innovation Challenge',
        status: 'active',
        start_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        tier: 'Sixth Form',
      },
      {
        title: 'Primary School Coding Sprint',
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        tier: 'Primary',
      },
    ];

    for (const comp of competitions) {
      await supabase.from('competitions').insert([
        {
          ...comp,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ]);
    }
    console.log(`✅ Created ${competitions.length} competitions\n`);

    // Seed submissions
    console.log('📤 Seeding submissions...');
    const submissions = [
      {
        title: 'Team Alpha - Robotics Challenge',
        description: 'Autonomous robot solution for obstacle navigation',
        status: 'submitted',
        score: 85,
      },
      {
        title: 'Team Beta - IoT Project',
        description: 'Smart home monitoring system using Arduino',
        status: 'submitted',
        score: 92,
      },
      {
        title: 'Team Gamma - ML Implementation',
        description: 'Image classification using TensorFlow',
        status: 'submitted',
        score: 78,
      },
      {
        title: 'Team Delta - Web Solution',
        description: 'Interactive dashboard for sensor data',
        status: 'submitted',
        score: 88,
      },
      {
        title: 'Team Epsilon - Code Optimization',
        description: 'Optimized algorithm for real-time processing',
        status: 'draft',
        score: null,
      },
      {
        title: 'Team Zeta - Documentation',
        description: 'Comprehensive technical documentation',
        status: 'submitted',
        score: 95,
      },
      {
        title: 'Team Eta - Integration',
        description: 'Full stack application integration',
        status: 'under_review',
        score: null,
      },
      {
        title: 'Team Theta - Testing',
        description: 'Automated testing suite',
        status: 'submitted',
        score: 81,
      },
    ];

    for (const sub of submissions) {
      await supabase.from('submissions').insert([
        {
          ...sub,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ]);
    }
    console.log(`✅ Created ${submissions.length} submissions\n`);

    console.log('✨ Database seeding complete!\n');
    console.log('Summary:');
    console.log(`  📚 Learning paths: ${learningPaths.length}`);
    console.log(`  👥 Student profiles: ${students.length}`);
    console.log(`  🏆 Competitions: ${competitions.length}`);
    console.log(`  📤 Submissions: ${submissions.length}`);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedData();
