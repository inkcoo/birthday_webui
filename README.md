# 🎂 Birthdays Reminder Pro

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)

> 企业级生日提醒管理系统 - 支持一键部署、Web管理、邮件提醒

![Dashboard Preview](https://via.placeholder.com/800x400?text=Birthdays+Reminder+Pro+Dashboard)

## ✨ 功能特性

- 🚀 **一键安装** - 支持 Ubuntu/Debian/CentOS 等 Linux 系统
- 🌐 **WebUI 管理** - 响应式设计，支持移动端访问
- 🔐 **密码保护** - JWT 认证 + 密码强度验证
- 📧 **邮箱验证** - 忘记密码可通过邮箱验证重置
- 📝 **生日管理** - 增删查改、部门分类、农历/公历支持
- ⏰ **提前提醒** - 支持设置提前 N 天提醒
- 🌏 **北京时间** - 所有时间使用 Asia/Shanghai 时区
- ⚙️ **SMTP 配置** - WebUI 在线配置邮件服务
- 💻 **CLI 工具** - `birthday` 命令行管理工具
- 🔄 **systemd 服务** - 开机自启动、崩溃自动重启

## 📦 快速开始

### 方式一：一键安装（推荐）

```bash
# 下载并运行安装脚本
curl -fsSL https://raw.githubusercontent.com/inkcoo/birthdays_reminder/main/deploy/install.sh | bash
```

安装完成后：
- 访问地址：`http://<服务器IP>:3000`
- 管理命令：`birthday --help`

### 方式二：手动安装

```bash
# 克隆仓库
git clone https://github.com/inkcoo/birthdays_reminder.git
cd birthdays_reminder

# 安装依赖
npm install
# 或使用 bun
bun install

# 初始化数据库
npm run db:push

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
npm start
```

## 🛠️ CLI 命令

安装后可使用 `birthday` 命令管理：

```bash
birthday status      # 查看服务状态
birthday start       # 启动服务
birthday stop        # 停止服务
birthday restart     # 重启服务
birthday logs -f     # 实时查看日志
birthday port 8080   # 修改服务端口
birthday password    # 重置管理员密码
birthday backup      # 备份数据库
birthday restore     # 恢复数据
birthday uninstall   # 彻底卸载程序
```

## 📁 项目结构

```
birthdays_reminder/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API 路由
│   │   └── page.tsx        # 主页面
│   ├── components/         # React 组件
│   ├── lib/               # 工具库
│   └── stores/            # 状态管理
├── prisma/
│   └── schema.prisma      # 数据库模型
├── deploy/
│   ├── install.sh         # 一键安装脚本
│   ├── uninstall.sh       # 卸载脚本
│   ├── systemd/           # systemd 服务
│   └── cli/               # CLI 工具
├── db/
│   └── birthdays.db       # SQLite 数据库
└── public/                # 静态资源
```

## 🔌 API 文档

### 认证

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/password` | PUT | 修改密码 |
| `/api/auth/forgot-password` | POST | 发送验证码 |
| `/api/auth/reset-password` | POST | 重置密码 |
| `/api/auth/init` | POST | 初始化系统 |

### 生日管理

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/birthdays` | GET/POST | 列表/创建 |
| `/api/birthdays/[id]` | GET/PUT/DELETE | 详情/更新/删除 |
| `/api/birthdays/upcoming` | GET | 即将到来的生日 |

### 系统设置

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/settings` | GET/PUT | 系统设置 |
| `/api/settings/smtp` | GET/PUT | SMTP 配置 |

## ⚙️ 配置说明

### 环境变量

创建 `.env` 文件：

```env
# 数据库
DATABASE_URL=file:./db/birthdays.db

# JWT 密钥（生产环境请修改！）
JWT_SECRET=your-super-secret-key-change-in-production

# 环境
NODE_ENV=production
```

### SMTP 配置

常见邮箱 SMTP 设置：

| 邮箱 | 服务器 | 端口 | 说明 |
|------|--------|------|------|
| QQ邮箱 | smtp.qq.com | 465 | 需使用授权码 |
| 163邮箱 | smtp.163.com | 465 | 需使用授权码 |
| Gmail | smtp.gmail.com | 587 | 需应用专用密码 |

## 🔒 安全特性

- ✅ 密码 bcrypt 哈希存储（12 rounds）
- ✅ JWT 令牌认证（7天有效期）
- ✅ 密码强度验证（8位+大小写+数字）
- ✅ 验证码 15 分钟有效期
- ✅ SQL 注入防护（Prisma 参数化查询）
- ✅ XSS 防护（React 自动转义）

## 🧪 技术栈

- **框架**: Next.js 16 + App Router
- **语言**: TypeScript 5
- **样式**: Tailwind CSS 4 + shadcn/ui
- **数据库**: Prisma ORM + SQLite
- **认证**: JWT + bcrypt
- **邮件**: nodemailer
- **农历**: lunar-javascript
- **状态**: Zustand

## 📝 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 代码检查
npm run lint

# 数据库操作
npm run db:push      # 同步模型
npm run db:studio    # 打开数据库 GUI
```

## 📄 许可证

[MIT License](LICENSE)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**Birthdays Reminder Pro** - 让每一个生日都不被遗忘 🎂
