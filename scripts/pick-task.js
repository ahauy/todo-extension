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
    
    let currentTask = null;
    for (const line of lines) {
      if (line.match(/^## \[ \]/)) {
        const match = line.match(/^## \[ \] (.+)/);
        if (match) {
          currentTask = {
            title: match[1],
            assigned: '',
            branch: '',
            status: 'todo',
            lineStart: lines.indexOf(line)
          };
          tasks.push(currentTask);
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
    
    const taskIdx = await question('\n🎯 Pick task number: ');
    const selectedTask = tasks[parseInt(taskIdx) - 1];
    
    if (!selectedTask) {
      console.log('❌ Invalid task number');
      process.exit(1);
    }
    
    // 4. Ask for person name
    const personName = await question('👤 Your name: ');
    
    // 5. Generate branch name
    const branchName = `feature/task-${tasks.indexOf(selectedTask) + 1}-${selectedTask.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
    
    // 6. Update task file
    let updatedContent = content;
    const taskTitle = selectedTask.title;
    
    updatedContent = updatedContent.replace(
      `## [ ] ${taskTitle}`,
      `## [x] ${taskTitle}`
    );
    
    updatedContent = updatedContent.replace(
      `## [x] ${taskTitle}\n- Assigned: \n- Branch: \n- Status: todo`,
      `## [x] ${taskTitle}\n- Assigned: @${personName}\n- Branch: ${branchName}\n- Status: in-progress`
    );
    
    fs.writeFileSync(taskFile, updatedContent);
    
    // 7. Commit + push
    console.log('\n⏳ Committing and pushing...');
    
    try {
      execSync('git add tasks/', { stdio: 'inherit' });
      execSync(`git commit -m "chore: Pick task - ${taskTitle}"`, { stdio: 'inherit' });
      execSync('git push origin main', { stdio: 'inherit' });
      console.log('✅ Pushed to main');
    } catch (e) {
      console.log('⚠️  Git push failed (might be offline or no changes)');
    }
    
    // 8. Create feature branch
    console.log('\n⏳ Creating feature branch...');
    try {
      execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
      console.log(`✅ Branch created: ${branchName}`);
    } catch (e) {
      console.log(`⚠️  Branch creation failed`);
    }
    
    console.log('\n✨ Done!');
    console.log(`📌 Task: ${taskTitle}`);
    console.log(`👤 Assigned to: @${personName}`);
    console.log(`🌿 Branch: ${branchName}`);
    
    rl.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

main();
