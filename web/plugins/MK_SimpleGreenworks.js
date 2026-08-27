//=============================================================================
// MK_SimpleGreenworks.js
// 接入steam成就_简单使用Greenworks
//=============================================================================
//  author : Mikan 
//  plugin : MK_SimpleGreenworks.js 接入steam成就_简单使用Greenworks
// version : v0.1.0.fix1 2021/01/12 解决初始化卡顿问题
// ------------------------------------------------------------------------------
// [Twitter] https://twitter.com/_MikanHako/
// -[GitHub] https://github.com/MikanHako1024/
// ---[Blog] NONE
// -----[QQ] 312859582
//=============================================================================




/*:
 * @plugindesc 接入steam成就_简单使用Greenworks <MK_SimpleGreenworks>
 * @author Mikan 
 * @version v0.1.0.fix1 2021/01/12 解决初始化卡顿问题
 * v0.1.0 2021/01/10 完成初始化、成就相关插件指令
 * v0.0.0 2021/01/09 项目计划中
 * 
 * 
 * @help
 * 
 * ---- 简要说明 ----
 * 
 * 非常感谢 greenheartgames 开发的 greenworks
 * 提供了 js 调用 steam-api 的能力
 * 仓库/介绍 : https://github.com/greenheartgames/greenworks
 * steam SDK : https://partner.steamgames.com/doc/sdk
 * 
 * 本插件提供 steam接口的一些基础的功能的使用
 *   如 : 获得成就，查看成就
 * 如有能力，也可以自行调用接口
 * API : https://github.com/greenheartgames/greenworks/wiki/API-Reference
 * 
 * 安装见 【使用方法】
 * 使用见 【插件指令】 和 【其他说明】
 * 
 * 需要注意的是，初始化steam-api失败或等待完成时，游戏并不会暂停
 * 这样不会因为网络问题导致卡死
 * 但游戏启动最初的一段时间(受用户配置影响，大约1s-3s？)，可能无法使用steam-api
 * 
 * 
 * ---- 插件指令 ----
 * 
 * # 检查steam-api是否可用
 *   打开调试控制台查看，或写入开关
 *     Steam checkAvailable
 *     Steam checkAvailable 开关id
 * 
 * # 获得成就
 *     Steam activateAchievement 成就名
 * 
 * # 查看是否获得成就
 *   打开调试控制台查看 (TODO : 写入开关)
 *     Steam getAchievement 成就名
 * 
 * # 清除成就
 *     Steam clearAchievement 成就名
 * 
 * 
 * ---- 使用方法 ----
 * 
 * # 搜索相关教程，寻求帮助
 * 或
 * # 加入以下文件
 * 
 *   greenworks.js
 *   greenworks-[xxx].node
 *     下载 : 
 *       https://github.com/greenheartgames/greenworks/releases/
 *       请选择所需操作系统对应的文件
 *     目录 : 
 *       [game]/greenworks.js
 *       [game]/lib/greenworks-[xxx].node
 *   
 *   (此处以win64为例，请选择所需操作系统对应的文件)
 *   sdkencryptedappticket.dll
 *   sdkencryptedappticket.lib
 *   steam_api.dll, steam_api64.dll
 *   steam_api.lib, steam_api64.lib
 *     下载 : 
 *       原址 : https://partner.steamgames.com/doc/sdk
 *       懒人 : https://partner.steamgames.com/downloads/steamworks_sdk.zip
 *         sdkencryptedappticket : [解压位置]\sdk\public\steam\lib
 *         steam_api : [解压位置]\sdk\redistributable_bin
 *         请选择所需操作系统对应的文件
 *     目录 : 
 *       [game]/lib/sdkencryptedappticket.dll
 *       [game]/lib/sdkencryptedappticket.lib
 *       [game]/lib/steam_api.dll
 *       [game]/lib/steam_api.lib
 *       [game]/lib/steam_api64.dll
 *       [game]/lib/steam_api64.lib
 * 
 *   steam_appid.txt
 *     记事本打开，填入游戏appid，保存
 *     目录 : 
 *       [game]/steam_appid.txt
 * 
 * 
 * ---- 其他说明 ----
 * 
 * 脚本
 *   # 获得greenworks模块
 *       window.greenworks
 *   # steam-api初始化是否成功
 *       window.initSteamAPISuccess
 * 
 *   # steam-api是否可用
 *       SteamAPI.checkAvailable()
 * 
 *   # 获得成就
 *       SteamAPI.activateAchievement(achievement, callbackSuccess, callbackFail)
 *   # 查看是否获得成就
 *       SteamAPI.getAchievement(achievement, callbackSuccess, callbackFail)
 *   # 清除成就
 *       SteamAPI.clearAchievement(achievement, callbackSuccess, callbackFail)
 * 
 * 
 * ---- 标签设置 ----
 * 
 * TODO
 * 
 * ---- 参数描述 ----
 * 
 * TODO
 * 
 * ---- 用语说明 ----
 * 
 * TODO
 * 
 * ---- 开发方法 ----
 * 
 * TODO
 * 
 * ---- 后续任务 ----
 * 
 * □ 更多api调用
 *   □ 用户信息
 *   □ 检查账户失败时，关闭游戏
 * ...
 * 
 * ---- 使用规约 ----
 * 
 * 此插件由客户私人定制，其保留完全的使用权，以及二次开发的权利。
 * 二次创作保留页眉的著作权表示部分，谢谢。
 * 此插件的著作权归插件作者所有，同时享有使用权等其他权利。
 * 
 * 如果需要使用本插件，请联系插件作者授权，联系方式在下方。
 * 当然，没有授权也能使用，不过能事先联系的话，我会很感谢；否则，我留有追究责任的权利。
 * 
 * 使用形式（自由游戏、商业游戏、R-18作品等）没有限制，请随意使用。
 * 使用此插件的创作作品出现的法律问题，插件作者不负任何责任。
 * 
 * 创作中，由于使用此插件而发生的问题，插件作者不负任何责任。有必要时请注意备份。
 * 
 * 如果您有任何要求，您可能需要本插件的版本升级，请联系插件作者。
 * 根据版本升级，本插件的规格有可能变更，请谅解。
 * 
 * 如果有什么意见或建议可以联系我，欢迎唠嗑。
 * 
 * ---- 联系方式 ----
 * [Twitter] https://twitter.com/_MikanHako/
 * -[GitHub] https://github.com/MikanHako1024/
 * ---[Blog] NONE
 * -----[QQ] 312859582
 * 
 * 
 * 
 * 
 * @param ==== 游戏参数配置 ====
 * 
 * @param 
 * @text 
 * @desc 
 * @type 
 * @default 
 * @parent 
 * 
 * @param ==== 插件指令配置 ====
 * 
 * @param 
 * @text 
 * @desc 
 * @type 
 * @default 
 * 
 * @param ==== 内容数据配置 ====
 * 
 * @param 
 * @text 
 * @desc 
 * @type 
 * @default 
 * 
 * @param ==== under ====
 * 
 */



(function() {

	window.greenworks = null;
	window.initSteamAPISuccess = false;

	const p = new Promise(function(resolve, reject) {
		resolve();
	})
	.then(function() {
		try {
			const greenworks = require('./greenworks');
			window.greenworks = greenworks;
			console.log('Welcome to use greenworks');
			console.log('https://github.com/greenheartgames/greenworks');

			return new Promise(function(resolve, reject) {
				greenworks && greenworks.initAPI() ? resolve() : reject();
			})
			.then(
				function() {
					window.initSteamAPISuccess = true;
					console.log('Steam API has been initalized.');
				}, 
				function() {
					window.initSteamAPISuccess = false;
					console.error('Error on initializing Steam API');
				}
			);
		}
		catch(e) {
			window.greenworks = null;
			console.error(e);
			console.error('Greenworks failed to load.');
			console.log('help : https://github.com/greenheartgames/greenworks');
		}
	});
})();



(function () {
	const steamAPI = {};
	window.steamAPI = steamAPI;

	// 注意判断steam-api初始化是否完成

	steamAPI.isAvailable = function() {
		return !!window.greenworks && !!window.initSteamAPISuccess;
	};

	steamAPI.unavailableWarning = function() {
		console.error('Steam API is unavailable.');
		return false;
	};

	steamAPI.checkAvailable = function() {
		if (this.isAvailable()) {
			console.log('Steam API is available.');
			return true;
		}
		else {
			this.unavailableWarning();
			return false;
		}
	};

	steamAPI.activateAchievement = function(achievement, cb1, cb2) {
		if (!this.isAvailable()) return this.unavailableWarning();
		window.greenworks.activateAchievement(
			achievement, 
			function() {
				cb1 ? cb1(achievement)
					: console.log(`activateAchievement ${achievement} success`);
			}, 
			function(e) {
				cb2 ? cb2(achievement, e)
					: console.error(`activateAchievement ${achievement} fail :`, e);
			}
		);
	};

	steamAPI.getAchievement = function(achievement, cb1, cb2) {
		if (!this.isAvailable()) return this.unavailableWarning();
		window.greenworks.getAchievement(
			achievement, 
			function(is_achieved) {
				cb1 ? cb1(achievement, is_achieved)
					: console.log(`getAchievement ${achievement} success :`, 
						is_achieved ? 'achieved' : 'not achieve');
			}, 
			function(e) {
				cb2 ? cb2(achievement, e)
					: console.error(`getAchievement ${achievement} fail :`, e);
			}
		);
	};

	steamAPI.clearAchievement = function(achievement, cb1, cb2) {
		if (!this.isAvailable()) return this.unavailableWarning();
		window.greenworks.clearAchievement(
			achievement, 
			function() {
				cb1 ? cb1(achievement)
					: console.log(`clearAchievement ${achievement} success`);
			}, 
			function(e) {
				cb2 ? cb2(achievement, e)
					: console.error(`clearAchievement ${achievement} fail :`, e);
			}
		);
	};
})();



(function() {
	const _MK_Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
	Game_Interpreter.prototype.pluginCommand = function (command, args) {
		_MK_Game_Interpreter_pluginCommand.apply(this, arguments);
		if ((command || '').toLowerCase() == 'steam') {
			const subCommand = (args.shift() || '').toLowerCase();
			switch (subCommand) {
				case 'checkavailable': 
					var isAvailable = window.steamAPI.checkAvailable();
					var switchId = Number(args[0] || 0);
					if (switchId > 0) {
						$gameSwitches.setValue(switchId, isAvailable);
					}
					break;
				case 'activateachievement':
					window.steamAPI.activateAchievement(args[0] || '');
					break;
				case 'getachievement':
					window.steamAPI.getAchievement(args[0] || '');
					break;
				case 'clearachievement':
					window.steamAPI.clearAchievement(args[0] || '');
					break;
			}
		}
	};
})();


