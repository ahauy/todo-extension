#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  try {
    const tasksDir = path.join(process.cwd(), 'tasks');
    
    // 1. Detect current layer
    let currentLayer = null;
    let taskFile = null;
    
    for (let i = 0; i < 10; i++) {
      const file = path.join(tasksDir, `layer-${i}-todo.md`);
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        // Check if layer has any [ ] (todo tasks)
        if (content.includes('[ ]')) {
          currentLayer = i;
          taskFile = file;
          break;
        }
      }
    }
    
    if (!currentLayer && currentLayer !== 0) {
      console.log('❌ No todo tasks found in any layer');
      process.exit(1);
    }
    
    console.log(`\n📋 Current Layer: layer-${currentLayer}`);
    
    // 2. Parse tasks
    const content = fs.readFileSync(taskFile, 'utf8');
    const tasks = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Match: ## [ ] Task Title
      if (line.match(/^##\s+\[\s*\]\s+/)) {
        const match = line.match(/^##\s+\[\s*\]\s+(.+)/);
        if (match) {
          const taskTitle = match[1].trim();
          tasks.push({
            title: taskTitle,
            lineIndex: i,
            assigned: '',
            branch: '',
            status: 'todo'
          });
        }
      }
    }
    
    if (tasks.length === 0) {
      console.log('❌ No todo tasks found');
      process.exit(1);
    }
    
    // 3. Show tasks and ask user to pick
    console.log('\n📝 Available Tasks:');
    tasks.forEach((task, idx) => {
      console.log(`  ${idx + 1}. ${task.title}`);
    });
    
    const taskInput = await question('\n🎯 Pick task numbers (e.g., 1,2,3 or 1 2 3): ');
    
    // Parse input: support both comma and space separated
    const taskIndices = taskInput
      .split(/[,\s]+/)
      .map(x => parseInt(x.trim()))
      .filter(x => !isNaN(x));
    
    if (taskIndices.length === 0) {
      console.log('❌ No valid task numbers provided');
      process.exit(1);
    }
    
    // Validate all task indices
    for (const idx of taskIndices) {
      if (idx < 1 || idx > tasks.length) {
        console.log(`❌ Invalid task number: ${idx}`);
        process.exit(1);
      }
    }
    
    // 4. Ask for person name
    const personName = await question('👤 Your name: ');
    
    // 5. Process each task
    const pickedTasks = [];
    let updatedContent = content;
    
    for (const taskIdx of taskIndices) {
      const selectedTask = tasks[taskIdx - 1];
      const taskTitle = selectedTask.title;
      const branchName = `feature/task-${taskIdx}-${taskTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
      
      console.log(`\n⏳ Processing task ${taskIdx}: ${taskTitle}...`);
      
      // Find and replace task header + metadata
      const taskHeaderRegex = new RegExp(
        `^## \\[\\s*\\]\\s+${taskTitle.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\s*$[\\s\\S]*?(?=^##|$)`,
        'gm'
      );
      
      const replacement = `## [x] ${taskTitle}\n- Assigned: @${personName}\n- Branch: ${branchName}\n- Status: in-progress\n`;
      
      updatedContent = updatedContent.replace(taskHeaderRegex, replacement);
      
      pickedTasks.push({
        title: taskTitle,
        branch: branchName,
        index: taskIdx
      });
    }
    
    // Write updated content once
    fs.writeFileSync(taskFile, updatedContent);
    
    // 6. Commit + push all tasks
    console.log('\n⏳ Committing and pushing all tasks...');
    
    try {
      execSync('git add tasks/', { stdio: 'inherit' });
      const taskTitles = pickedTasks.map(t => t.title).join(', ');
      execSync(`git commit -m "chore: Pick ${pickedTasks.length} tasks - ${taskTitles.substring(0, 50)}${taskTitles.length > 50 ? '...' : ''}"`, { stdio: 'inherit' });
      execSync('git push origin main', { stdio: 'inherit' });
      console.log('✅ Pushed to main');
    } catch (e) {
      console.log('⚠️  Git push failed (might be offline or no changes)');
    }
    
    // 7. Create feature branches
    console.log('\n⏳ Creating feature branches...');
    for (const task of pickedTasks) {
      try {
        execSync(`git checkout -b ${task.branch}`, { stdio: 'inherit' });
        console.log(`✅ Branch created: ${task.branch}`);
      } catch (e) {
        console.log(`⚠️  Branch creation failed for ${task.branch}`);
      }
    }
    
    // 8. Summary
    console.log('\n✨ Done!');
    console.log(`📌 Picked ${pickedTasks.length} task(s):`);
    pickedTasks.forEach((task, idx) => {
      console.log(`  ${idx + 1}. ${task.title}`);
      console.log(`     🌿 ${task.branch}`);
    });
    console.log(`👤 Assigned to: @${personName}`);
    
    rl.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

main();
