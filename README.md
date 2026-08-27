# gal-Buy-a-Croquette-web

把「买个可乐饼吧！」（RPG Maker MV / Steam 版）改造为**网页版（PWA）**的完整指南与工具文件。

> 🎮 **在线试玩**：<https://gal.moehub.online/>
>
> ⚠️ 本仓库**不含任何游戏资源**（图片 / 音频 / 数据 / 字体 / 引擎脚本），游戏本体 **Steam 免费**，下载游戏文件后按本指南转换即可。

## 效果

- **浏览器直接游玩**，无需安装客户端
- **PWA**：可添加到手机主屏，支持离线缓存
- **移动端适配**：虚拟摇杆 + 触摸优化
- 多平台：PC（Chrome / Edge）、手机（iOS Safari / Android Chrome）

## 前置条件

- 游戏本体（**Steam 免费**）：<https://store.steampowered.com/> 搜索「买个可乐饼吧」下载，或已有游戏文件
- 原版目录结构即 RPG Maker MV 的 `www` 输出（`index.html` + `js/` + `img/` + `audio/` + `data/` + `fonts/`）
- 游戏自带的**玩法插件**（菜单 / 战斗 / 效果 / 烹饪系统等 YEP·MOG·YQ 系列）是游戏的一部分，**保持不动**，网页化只需新增本仓库的 3 个插件

## 快速开始

### 1. 备份并复制原版游戏

把原版游戏目录完整复制一份作为网页版工作目录，不要直接改原版。

### 2. 替换游戏入口页

原版根目录的 `index.html` 是启动/说明页；网页版需要一个能处理**浏览器音频自动播放限制**的入口。

把 `web/game-index.html` 复制到游戏根目录（可命名为 `index.html` 或保留原名）。它包含：

- 音频解锁遮罩：首次点击「开始游戏」后才解锁音频（绕过浏览器自动播放策略）
- iOS Safari 兼容（`apple-mobile-web-app`、`iphone-inline-video` 内联视频）

### 3. 添加 PWA 支持

```
web/manifest.json   →  游戏根目录/
web/sw.js           →  游戏根目录/
```

- `manifest.json`：PWA 清单（应用名称、图标、全屏显示）
- `sw.js`：Service Worker，离线缓存 + 版本更新（修改 `SW_VERSION` 可触发更新）

### 4. 安装网页化插件

将 `web/plugins/*.js` 复制到游戏的 `js/plugins/`，并在 `js/plugins.js` 中注册：

| 插件 | 作用 |
|------|------|
| `MK_SimpleGreenworks.js` | **网页版必装**。原版通过 greenworks 调用 Steam API，浏览器里没有 Steam，本插件自动检测并优雅降级，避免报错 |
| `VirtualJoystick.js` | 移动端虚拟摇杆（响应式布局，适配全屏/非全屏） |
| `TTKC_IgnoreMouseTouch.js` | 鼠标/触摸事件适配优化 |

> 建议同时在 `js/plugins.js` 里按原插件参数说明配置（如需调整摇杆位置、按键映射等）。

### 5. 部署

任意静态文件托管均可：

```bash
# nginx 示例
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/gal-croquette;
    index index.html;
    # sw.js 不能带缓存头（保证更新生效）
    location = /sw.js { add_header Cache-Control "no-cache"; }
}
```

或使用 GitHub Pages / 腾讯云 COS / 对象存储等。

### 6. 手机端 PWA

手机浏览器打开网址 → 菜单「添加到主屏」→ 全屏运行，如同 App。

## 多平台说明

| 平台 | 说明 |
|------|------|
| PC 浏览器 | Chrome / Edge / Firefox 直接游玩 |
| iOS | Safari 打开；「添加到主屏」体验最佳（全屏、无地址栏） |
| Android | Chrome 打开；PWA 支持良好 |

## 常见问题

- **音频不播放**：浏览器自动播放策略导致，点入口的「开始游戏」按钮即可解锁（`game-index.html` 已处理）
- **Steam 成就不可用**：网页版没有 Steam 环境，`MK_SimpleGreenworks` 会自动跳过成就逻辑，不影响游玩
- **存档位置**：RPG Maker MV 网页版存档保存在浏览器本地存储中，**同一浏览器同一设备**内有效；清除浏览器数据会丢档
- **字体显示异常**：确认 `fonts/` 目录完整，`game-index.html` 引用了 `fonts/gamefont.css`

## 版权声明

- 本仓库仅包含**转换指南与网页化改造文件**（入口页 / PWA 配置 / 插件），均为本人整理
- 游戏本体（图片、音频、数据、字体、RPG Maker MV 引擎）版权归原开发者所有
- 游戏本体 **Steam 免费**，请先下载原版游戏；本指南仅供已下载用户多平台游玩使用
