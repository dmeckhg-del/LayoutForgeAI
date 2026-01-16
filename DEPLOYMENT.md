# 部署说明

## GitHub Actions 自动部署

本项目配置了 GitHub Actions，当推送到 main 分支时会自动构建并部署到 GitHub Pages。

### 配置步骤

1. **创建 Personal Access Token (PAT)**

   **⚠️ 重要：跨仓库部署的特殊权限要求**

   本项目使用跨仓库部署（`external_repository: dmeckhg-del/dmeckhg-del.github.io`），因此 DEPLOY_TOKEN 必须满足以下要求：

   - ✅ **对目标仓库 `dmeckhg-del/dmeckhg-del.github.io` 有写权限**
   - ✅ **必须将目标仓库加入 token 的授权列表**（如果是 Fine-grained token）

   ### 创建步骤：

   #### 方式 A：Classic Token（推荐，简单）

   1. 访问：https://github.com/settings/tokens
   2. 点击 **"Generate new token"** → **"Generate new token (classic)"**
   3. 填写信息：
      - **Note**: `LayoutForgeAI-Page Deploy Token`
      - **Expiration**: 选择过期时间（建议 90 天或 No expiration）
      - **勾选权限**（必须全部勾选）：
        - ✅ **`repo`** - 完整仓库控制权限（这会自动包含以下所有子权限）
          - ✅ `repo:status`
          - ✅ `repo_deployment`
          - ✅ `public_repo`
          - ✅ `repo:invite`
          - ✅ `security_events`
      - ✅ **`workflow`** - 如果目标仓库有 GitHub Actions
   4. 点击 **"Generate token"**
   5. **立即复制 token**（只显示一次！）

   #### 方式 B：Fine-grained Token（更精细控制）

   1. 访问：https://github.com/settings/tokens
   2. 点击 **"Generate new token"** → **"Generate new token (fine-grained)"**
   3. 填写信息：
      - **Name**: `LayoutForgeAI-Page Deploy Token`
      - **Expiration**: 选择过期时间
      - **Description**: `Auto-deploy to dmeckhg-del.github.io`
   4. **资源授权**（Repository access）：
      - 选择 **"Only select repositories"**
      - **必须同时添加两个仓库**：
        - ✅ `LayoutForgeAI-Page`（源仓库）
        - ✅ `dmeckhg-del.github.io`（目标仓库）← **很重要！**
   5. **权限设置**（Permissions）：
      - ✅ **Contents**: **Read and write**
      - ✅ **Deployments**: **Read and write**（如果有）
      - ✅ **Pull requests**: **Read and write**
      - ✅ **Workflows**: **Read and write**（如果目标仓库有 workflows）
   6. 点击 **"Generate token"**
   7. **立即复制 token**

2. **在源仓库配置 Secret**
   - 访问：https://github.com//WaytoAGI-Community/LayoutForgeAI/settings/secrets/actions
   - 点击 **"New repository secret"**
   - **Name**: `DEPLOY_TOKEN`
   - **Secret**: 粘贴刚才复制的 PAT
   - 点击 **"Add secret"**

3. **验证目标仓库权限**
   - 确认你对 `dmeckhg-del.github.io` 仓库有 **Admin** 或 **Write** 权限
   - 访问：https://github.com/dmeckhg-del/dmeckhg-del.github.io/settings/collaboration
   - 如果没有权限，需要在目标仓库设置中添加自己为协作者

### 工作流程

触发条件：
- 推送到 `main` 分支
- 以下文件变更时触发：
  - `App.tsx`
  - `index.tsx`
  - `index.html`
  - `components/**`
  - `constants.ts`
  - `types.ts`
  - `.github/workflows/deploy.yml`

部署目标：
- 仓库：`dmeckhg-del/dmeckhg-del.github.io`
- 分支：`main`

### 手动触发

可以在 GitHub Actions 页面手动运行工作流：
1. 访问 https://github.com//WaytoAGI-Community/LayoutForgeAI/actions
2. 选择 "Build and Deploy to GitHub Pages"
3. 点击 "Run workflow"

### 本地测试

本地构建命令：
```bash
npm run build -- --outDir=./dist
```

### 注意事项

- 确保 `GEMINI_API_KEY` secret 也已配置（如果项目需要）
- 首次部署可能需要几分钟时间
- 部署完成后访问 https://dmeckhg-del.github.io/ 查看结果

---

## 常见错误和解决方案

### ❌ 403 Permission denied

**错误信息：**
```
remote: Permission to dmeckhg-del/dmeckhg-del.github.io.git denied to dmeckhg-del.
fatal: unable to access 'https://github.com/dmeckhg-del/dmeckhg-del.github.io.git/': The requested URL returned error: 403
Error: Action failed with "The process '/usr/bin/git' failed with exit code 128"
```

**原因分析：**
- DEPLOY_TOKEN 权限/目标仓库授权不够，无法写入目标仓库

**解决方案：**

1. **检查 Token 类型**
   - 如果使用 **Fine-grained Token**：
     - 必须在 **Repository access** 中添加目标仓库 `dmeckhg-del.github.io`
     - **Contents** 权限必须设置为 **Read and write**
   - 如果使用 **Classic Token**：
     - 必须勾选 `repo` 完整权限

2. **验证目标仓库权限**
   ```bash
   # 检查你对目标仓库的权限
   # 访问：https://github.com/dmeckhg-del/dmeckhg-del.github.io/settings/collaboration
   ```
   - 确保你的账号有 **Admin** 或 **Write** 权限
   - 如果是组织仓库，联系组织管理员

3. **重新创建 Token**
   - 删除旧的 token
   - 按照上面的步骤重新创建，确保权限正确
   - 更新源仓库的 `DEPLOY_TOKEN` secret

### ❌ Write access to repository not granted

**错误信息：**
```
remote: Write access to repository not granted
fatal: unable to access 'https://github.com/xxx/xxx.git/': The requested URL returned error: 403
```

**解决方案：**
- Fine-grained Token 必须在 **Repository access** 中明确添加目标仓库
- 勾选 **Contents: Read and write**

### ❌ Protected branch hook declined

**错误信息：**
```
remote: error: GH006: Protected branch update failed for refs/heads/main.
remote: error: At least one approving review is required for each pull request before it can be merged.
remote: error: Branch protection requires the status "ci/test" to pass.
```

**解决方案：**
- 目标仓库可能启用了分支保护规则
- 方案 1：临时禁用分支保护（Settings → Branches）
- 方案 2：将目标分支改为非保护分支（如 `gh-pages`）
- 方案 3：在 workflow 中使用 `publish_branch: gh-pages` 并创建该分支

### ❌ Resource not accessible by integration

**错误信息：**
```
Resource not accessible by integration
::error::Specifying the GitHub Token as input for 'personal_token' is deprecated. Please use an environment variable or use 'github.token'.
```

**解决方案：**
- 确保 token 的格式正确（没有多余的空格或换行符）
- 重新创建 token 并更新 secret

### ❌ Could not read from remote repository

**错误信息：**
```
fatal: Could not read from remote repository.
Please make sure you have the correct access rights and the repository exists.
```

**解决方案：**
- 检查目标仓库名称是否正确
- 确认仓库存在且可访问
- 验证 token 是否已正确配置

---

## 快速排查清单

遇到部署失败时，按顺序检查：

- [ ] Token 是否使用 **Classic** 类型，或 Fine-grained 类型已添加目标仓库
- [ ] Token 权限是否包含 **repo**（Classic）或 **Contents: Read and write**（Fine-grained）
- [ ] 目标仓库是否已添加到 token 的授权列表（Fine-grained）
- [ ] Secret `DEPLOY_TOKEN` 是否已正确配置在源仓库
- [ ] 你的账号是否有目标仓库的 **Write** 权限
- [ ] 目标仓库的分支是否启用了保护规则
- [ ] workflow 文件中的 `external_repository` 名称是否正确

---

## 仍然无法解决？

1. 查看 GitHub Actions 日志：https://github.com//WaytoAGI-Community/LayoutForgeAI/actions
2. 检查 workflow 运行的详细错误信息
3. 尝试手动运行 workflow 以排除 webhook 问题
4. 确认所有 secrets 都已正确配置

---

## 跨仓库部署架构说明

```
┌─────────────────────────────┐
│  LayoutForgeAI-Page    │
│  (源仓库)                   │
│                             │
│  - Push 到 main 分支         │
│  - 触发 GitHub Actions       │
│  - 构建 React 应用           │
└─────────────┬───────────────┘
              │
              │ DEPLOY_TOKEN (需要有目标仓库写权限)
              ▼
┌─────────────────────────────┐
│  dmeckhg-del.github.io      │
│  (目标仓库/GitHub Pages)     │
│                             │
│  - 接收构建产物             │
│  - 自动部署网站             │
└─────────────────────────────┘
```
