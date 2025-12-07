#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import degit from 'degit';
import { cyan, green, red } from 'kleur/colors.js';
import prompts from 'prompts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log(cyan('\n👋 Welcome to create-mvp-surf\n'));

  // 1. 프로젝트 이름 입력
  const response = await prompts({
    type: 'text',
    name: 'projectName',
    message: '프로젝트 폴더 이름을 입력하세요',
    initial: 'mvp-surf-app',
    validate: (value) => (value && value.trim().length > 0 ? true : '이름을 입력해주세요'),
  });

  const projectName = response.projectName.trim();
  const targetDir = path.resolve(process.cwd(), projectName);

  if (fs.existsSync(targetDir)) {
    console.log(red(`\n❌ ${projectName} 폴더가 이미 존재합니다. 다른 이름을 사용해주세요.\n`));
    process.exit(1);
  }

  // 2. GitHub 템플릿에서 복제
  console.log(cyan(`\n📦 템플릿을 다운로드 중입니다... (${projectName})\n`));

  const emitter = degit('coldsurfers/create-mvp-surf#main', {
    cache: false,
    force: true,
    verbose: true,
  });

  try {
    await emitter.clone(targetDir);
  } catch (e) {
    console.error(red('\n❌ 템플릿 복제 중 오류가 발생했습니다.'));
    console.error(e.message || e);
    process.exit(1);
  }

  // 3. package.json 이름 교체 (필요 시)
  const pkgPath = path.join(targetDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    pkg.name = projectName;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  }

  // 4. 의존성 설치 여부 물어보기
  const { install } = await prompts({
    type: 'toggle',
    name: 'install',
    message: '의존성을 바로 설치할까요?',
    initial: true,
    active: '네',
    inactive: '나중에',
  });

  if (install) {
    try {
      console.log(cyan('\n📥 패키지 설치 중입니다...\n'));
      const cmd = fs.existsSync(path.join(targetDir, 'pnpm-lock.yaml'))
        ? 'pnpm install'
        : fs.existsSync(path.join(targetDir, 'yarn.lock'))
          ? 'yarn'
          : 'npm install';

      execSync(cmd, {
        cwd: targetDir,
        stdio: 'inherit',
      });
    } catch (e) {
      console.error(red('\n❌ 패키지 설치 중 오류가 발생했습니다. 직접 설치해주세요.\n'));
    }
  }

  console.log(green('\n✅ 프로젝트 생성이 완료되었습니다!\n'));
  console.log(cyan(`  cd ${projectName}`));
  console.log(cyan('  npm run start        # 또는 yarn, pnpm 에 맞게 실행\n'));
}

main().catch((e) => {
  console.error(red('\n예상치 못한 오류가 발생했습니다.'));
  console.error(e);
  process.exit(1);
});
