# GX Monorepo

這是一個基於 Angular 20 的 monorepo 專案，包含多個可重用的組件庫。

## 專案結構

- `projects/demo/` - 示範應用程式
- `projects/gx-breadcrumb/` - 麵包屑導航組件庫
- `projects/shared-utils/` - 共用工具庫

## 技術堆疊

- **Angular**: 20.1.6
- **TypeScript**: 5.8.3
- **RxJS**: 7.8.0
- **Node.js**: 建議使用 LTS 版本

## 開發環境需求

- Node.js (LTS)
- npm 或 yarn
- Angular CLI 20.1.5

## 安裝與設定

\`\`\`bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm start

# 建構專案
npm run build

# 執行測試
npm test
\`\`\`

## 組件庫

### GX Breadcrumb

麵包屑導航組件，提供簡潔的頁面導航功能。

\`\`\`bash
# 建構 gx-breadcrumb 庫
ng build gx-breadcrumb
\`\`\`

### Shared Utils

包含共用的工具函數和服務。

\`\`\`bash
# 建構 shared-utils 庫
ng build shared-utils
\`\`\`

## 開發指南

### 新增組件

1. 使用 Angular CLI 生成新組件
2. 確保遵循專案的程式碼風格
3. 添加適當的測試

### 建構和發布

\`\`\`bash
# 建構所有庫
ng build gx-breadcrumb
ng build shared-utils

# 建構 demo 應用
ng build demo
\`\`\`

## 版本管理

本專案使用 Changesets 進行版本管理：

\`\`\`bash
# 添加變更記錄
npx changeset

# 發布新版本
npx changeset version
\`\`\`

## 貢獻指南

1. Fork 本專案
2. 創建功能分支
3. 提交變更
4. 創建 Pull Request

## 授權

[授權信息]
