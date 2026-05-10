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
    console.log('📝 Adding emerging task to current layer...\n');
    
    // 2. Get task details
    const taskTitle = await question('🎯 Task title: ');
    const taskDescription = await question('📄 Task description (optional): ');
    
    // 3. Add task to layer file
    const content = fs.readFileSync(taskFile, 'utf8');
    const lines = content.split('\n');
    
    // Find last task and add new one after it
    let lastTaskIndex = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].match(/^## \[/)) {
        lastTaskIndex = i;
        break;
      }
    }
    
    let newTask = `\n## [ ] ${taskTitle}`;
    if (taskDescription) {
      newTask += `\n- Description: ${taskDescription}`;
    }
    newTask += `\n- Assigned: \n- Branch: \n- Status: todo`;
    
    if (lastTaskIndex >= 0) {
      // Find the end of last task (next empty line or end of file)
      let insertIndex = lastTaskIndex + 1;
      while (insertIndex < lines.length && lines[insertIndex].trim() !== '') {
        insertIndex++;
      }
      lines.splice(insertIndex, 0, newTask);
    } else {
      lines.push(newTask);
    }
    
    const updatedContent = lines.join('\n');
    fs.writeFileSync(taskFile, updatedContent);
    
    console.log('\n✅ Task added to layer-' + currentLayer + '-todo.md');
    
    // 4. Commit
    console.log('\n⏳ Committing...');
    try {
      execSync('git add tasks/', { stdio: 'inherit' });
      execSync(`git commit -m "chore: Add emerging task - ${taskTitle}"`, { stdio: 'inherit' });
      console.log('✅ Committed');
    } catch (e) {
      console.log('⚠️  Git commit failed');
    }
    
    // 5. Instructions
    console.log('\n📋 Next steps:');
    console.log('1. Brainstorm the task (clarify, propose, design)');
    console.log('2. Update docs/SCOPE_BREAKDOWN.md if dependency changed');
    console.log('3. Run: graphify ./src (to update graph)');
    console.log('4. Update CLAUDE.md/CODEX.md context if needed');
    console.log('5. Run: npm run pick-task (to assign the task)');
    
    console.log('\n✨ Done!');
    console.log(`📌 Task: ${taskTitle}`);
    console.log(`📍 Layer: layer-${currentLayer}`);
    
    rl.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

main();
