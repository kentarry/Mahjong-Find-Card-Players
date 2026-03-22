// ============================================================
// 🀄 湊咖 Còukā — Google Sheets 牌局管理程式
// ============================================================
// 使用方式：
// 1. 開啟你的 Google 試算表
// 2. 點選上方選單「擴充功能」→「Apps Script」
// 3. 將此程式碼全部貼上，取代原本的內容
// 4. 按下「儲存」(Ctrl+S)
// 5. 回到試算表，重新整理頁面
// 6. 上方會出現「🀄 湊咖管理」選單
// 7. 點選「初始化試算表」即可自動建立所有欄位
// ============================================================

// ─── 選單設定 ─────────────────────────────────────────────────
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("🀄 湊咖管理")
    .addItem("📋 初始化試算表", "初始化試算表")
    .addSeparator()
    .addItem("➕ 新增牌局", "新增牌局對話框")
    .addItem("🔄 更新所有狀態", "自動更新狀態")
    .addItem("🧹 清除過期牌局", "清除過期牌局")
    .addSeparator()
    .addItem("📊 牌局統計", "顯示統計")
    .addItem("❓ 使用說明", "顯示使用說明")
    .addToUi();
}

// ─── 常數定義 ─────────────────────────────────────────────────
var 工作表名稱 = "麻將紀錄";

var 標題列 = [
  "編號",         // A - 唯一識別碼
  "主揪暱稱",     // B
  "主揪頭像",     // C - emoji
  "主揪帳號",     // D - Threads ID（含@）
  "主揪自介",     // E
  "縣市",         // F
  "行政區",       // G
  "場地名稱",     // H
  "場地類型",     // I - 公開棋牌社 / 私人住宅 / 其他
  "缺額人數",     // J - 1~3
  "已報名",       // K - 0~3
  "開打時間",     // L - 日期時間
  "底台金額",     // M - 如 300/100
  "條件標籤",     // N - 逗號分隔
  "狀態",         // O - 招募中 / 已滿局 / 已停權 / 已結束
  "檢舉次數"      // P
];

var 場地類型選項 = ["公開棋牌社", "私人住宅", "其他"];

var 狀態選項 = ["招募中", "已滿局", "已停權", "已結束"];

var 狀態對應表 = {
  "招募中": "open",
  "已滿局": "closed",
  "已停權": "suspended",
  "已結束": "expired"
};

var 縣市資料 = {
  "台北市": ["中正區","大同區","中山區","松山區","大安區","萬華區","信義區","士林區","北投區","內湖區","南港區","文山區"],
  "新北市": ["板橋區","三重區","中和區","永和區","新莊區","新店區","土城區","蘆洲區","樹林區","汐止區","鶯歌區","三峽區","淡水區","林口區"],
  "桃園市": ["桃園區","中壢區","大溪區","楊梅區","蘆竹區","龜山區","八德區","平鎮區"],
  "台中市": ["中區","東區","南區","西區","北區","北屯區","西屯區","南屯區","豐原區","大里區","太平區"],
  "台南市": ["中西區","東區","南區","北區","安平區","安南區","永康區","新營區"],
  "高雄市": ["新興區","前金區","苓雅區","鹽埕區","鼓山區","旗津區","前鎮區","三民區","楠梓區","小港區","左營區","鳳山區"],
  "基隆市": ["仁愛區","信義區","中正區","中山區","安樂區","暖暖區","七堵區"],
  "新竹市": ["東區","北區","香山區"],
  "嘉義市": ["東區","西區"]
};

var 所有標籤 = {
  "🏠 場地設施": ["有廁所","有冷氣","有停車位","有電動麻將桌","手動麻將桌","有茶水","有零食飲料","有Wi-Fi","有貓狗","近捷運站","有電梯","有充電座"],
  "🚬 菸酒規定": ["禁菸","可菸","可電子菸","禁電子菸","可飲酒","禁酒","可帶外食"],
  "👤 性別限制": ["限女性","限男性","不限性別","限學生","限上班族","限年滿18歲","限年滿20歲"],
  "🀄 牌規": ["台灣麻將16張","廣東麻將13張","日本麻將","禁短牌","花牌","哩咕","嚦咕嚦咕","門清有平胡","台數限制","自摸加倍","連莊拉莊","放槍全包"],
  "🎯 玩家偏好": ["新手友善","快手","安靜打牌","歡樂場","認真場","可聊天","可帶朋友","固定咖","臨時湊人","教學局"]
};

var 底台快選 = ["50/10","100/20","100/50","200/50","300/100","500/100","500/200","1000/300"];

// ─── 初始化試算表 ─────────────────────────────────────────────
function 初始化試算表() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(工作表名稱);

  if (!sheet) {
    sheet = ss.insertSheet(工作表名稱);
  }

  // 清除舊資料
  sheet.clear();

  // 設定標題列
  var 標題範圍 = sheet.getRange(1, 1, 1, 標題列.length);
  標題範圍.setValues([標題列]);
  標題範圍.setFontWeight("bold");
  標題範圍.setBackground("#1b2030");
  標題範圍.setFontColor("#e8a838");
  標題範圍.setHorizontalAlignment("center");
  標題範圍.setFontSize(10);

  // 凍結標題列
  sheet.setFrozenRows(1);

  // 設定欄寬
  var 欄寬 = [60, 100, 60, 120, 150, 70, 70, 120, 90, 70, 70, 140, 80, 250, 70, 70];
  for (var i = 0; i < 欄寬.length; i++) {
    sheet.setColumnWidth(i + 1, 欄寬[i]);
  }

  // 設定資料驗證規則（第 2 列到第 500 列）
  var 最後列 = 500;

  // I 欄：場地類型 — 下拉選單
  var 場地驗證 = SpreadsheetApp.newDataValidation()
    .requireValueInList(場地類型選項, true)
    .setAllowInvalid(false)
    .setHelpText("請選擇場地類型：公開棋牌社、私人住宅、其他")
    .build();
  sheet.getRange(2, 9, 最後列 - 1, 1).setDataValidation(場地驗證);

  // J 欄：缺額人數 — 限制 1~3
  var 缺額驗證 = SpreadsheetApp.newDataValidation()
    .requireValueInList(["1", "2", "3"], true)
    .setAllowInvalid(false)
    .setHelpText("缺額人數：1 到 3 人")
    .build();
  sheet.getRange(2, 10, 最後列 - 1, 1).setDataValidation(缺額驗證);

  // K 欄：已報名 — 限制 0~3
  var 報名驗證 = SpreadsheetApp.newDataValidation()
    .requireValueInList(["0", "1", "2", "3"], true)
    .setAllowInvalid(false)
    .setHelpText("已報名人數：0 到 3 人")
    .build();
  sheet.getRange(2, 11, 最後列 - 1, 1).setDataValidation(報名驗證);

  // L 欄：開打時間 — 日期格式
  sheet.getRange(2, 12, 最後列 - 1, 1).setNumberFormat("yyyy/mm/dd hh:mm");

  // O 欄：狀態 — 下拉選單（繁體中文）
  var 狀態驗證 = SpreadsheetApp.newDataValidation()
    .requireValueInList(狀態選項, true)
    .setAllowInvalid(false)
    .setHelpText("牌局狀態：招募中、已滿局、已停權、已結束")
    .build();
  sheet.getRange(2, 15, 最後列 - 1, 1).setDataValidation(狀態驗證);

  // P 欄：檢舉次數 — 數字
  var 檢舉驗證 = SpreadsheetApp.newDataValidation()
    .requireNumberGreaterThanOrEqualTo(0)
    .setAllowInvalid(false)
    .setHelpText("檢舉次數（數字，從 0 開始）")
    .build();
  sheet.getRange(2, 16, 最後列 - 1, 1).setDataValidation(檢舉驗證);

  // 設定整體樣式
  sheet.getRange(2, 1, 最後列 - 1, 標題列.length).setFontSize(10);
  sheet.getRange(2, 1, 最後列 - 1, 標題列.length).setVerticalAlignment("middle");

  // 寫入範例資料
  var 兩小時後 = new Date();
  兩小時後.setHours(兩小時後.getHours() + 2);

  var 範例 = [
    1,                          // 編號
    "麻將小王子",                // 主揪暱稱
    "🀄",                       // 主揪頭像
    "@mahjong_prince",          // 主揪帳號
    "打牌十年，歡迎新手",         // 主揪自介
    "台北市",                    // 縣市
    "中山區",                    // 行政區
    "XX棋牌社",                  // 場地名稱
    "公開棋牌社",                // 場地類型
    2,                          // 缺額人數
    1,                          // 已報名
    兩小時後,                    // 開打時間
    "300/100",                  // 底台金額
    "禁菸,有茶水,有電動麻將桌,有廁所,有冷氣,花牌,新手友善,歡樂場,不限性別,近捷運站,台灣麻將16張",
    "招募中",                    // 狀態
    0                           // 檢舉次數
  ];
  sheet.getRange(2, 1, 1, 範例.length).setValues([範例]);
  sheet.getRange(2, 12).setNumberFormat("yyyy/mm/dd hh:mm");

  // 設定條件格式規則
  設定條件格式(sheet);

  // 新增說明工作表
  建立說明工作表(ss);

  SpreadsheetApp.getUi().alert(
    "✅ 初始化完成！",
    "試算表已設定完成，包含：\n" +
    "• 16 個欄位（全繁體中文標題）\n" +
    "• 下拉選單驗證（場地類型、缺額人數、狀態等）\n" +
    "• 範例資料一筆\n" +
    "• 條件格式（狀態自動變色）\n" +
    "• 使用說明工作表\n\n" +
    "⚠️ 請記得到「共用」設定中，將試算表設為「知道連結的任何人 → 檢視者」",
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

// ─── 條件格式：狀態欄自動變色 ─────────────────────────────────
function 設定條件格式(sheet) {
  sheet.clearConditionalFormatRules();
  var 規則 = [];
  var 狀態範圍 = sheet.getRange("O2:O500");
  var 場地範圍 = sheet.getRange("I2:I500");

  規則.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo("招募中").setBackground("#d1fae5").setFontColor("#065f46").setRanges([狀態範圍]).build());
  規則.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo("已滿局").setBackground("#fee2e2").setFontColor("#991b1b").setRanges([狀態範圍]).build());
  規則.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo("已停權").setBackground("#ffedd5").setFontColor("#9a3412").setRanges([狀態範圍]).build());
  規則.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo("已結束").setBackground("#f3f4f6").setFontColor("#6b7280").setRanges([狀態範圍]).build());
  規則.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo("公開棋牌社").setBackground("#d1fae5").setFontColor("#065f46").setRanges([場地範圍]).build());
  規則.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo("私人住宅").setBackground("#fef3c7").setFontColor("#92400e").setRanges([場地範圍]).build());

  sheet.setConditionalFormatRules(規則);
}

// ─── 新增牌局對話框 ──────────────────────────────────────────
function 新增牌局對話框() {
  var html = HtmlService.createHtmlOutput(`
    <style>
      *{box-sizing:border-box;font-family:"Microsoft JhengHei","Noto Sans TC",sans-serif}
      body{padding:16px;background:#0f1119;color:#e8eaf0}
      label{display:block;font-size:12px;color:#9ca3b4;margin:8px 0 3px;font-weight:600}
      input,select,textarea{width:100%;padding:8px 10px;border:1px solid rgba(255,255,255,0.1);border-radius:6px;background:#0b0d14;color:#e8eaf0;font-size:13px;font-family:inherit}
      input:focus,select:focus,textarea:focus{outline:none;border-color:#e8a838}
      .row{display:flex;gap:8px}.row>div{flex:1}
      .btn{padding:10px 20px;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;font-family:inherit;margin-top:12px}
      .btn-ok{background:#e8a838;color:#0a0b10}.btn-cancel{background:transparent;color:#9ca3b4;border:1px solid rgba(255,255,255,0.1)}
      .hint{font-size:10px;color:#5a6174;margin-top:2px}
      h3{color:#e8a838;margin:0 0 12px;font-size:16px}
      .sq{padding:3px 10px;border-radius:12px;font-size:11px;cursor:pointer;background:#1b2030;color:#9ca3b4;border:1px solid rgba(255,255,255,0.06);font-family:inherit}
    </style>
    <h3>🀄 新增牌局</h3>
    <div class="row"><div><label>主揪暱稱 *</label><input id="f名稱" placeholder="你的暱稱"/></div><div><label>主揪頭像</label><input id="f頭像" value="🀄" style="text-align:center"/></div></div>
    <label>Threads 帳號 *</label><input id="f帳號" placeholder="@your_threads_id"/>
    <label>自我介紹</label><input id="f自介" placeholder="簡短介紹自己"/>
    <div class="row"><div><label>縣市 *</label><select id="f縣市"><option value="">請選擇</option>${Object.keys(縣市資料).map(function(c){return'<option>'+c+'</option>'}).join("")}</select></div><div><label>行政區</label><input id="f行政區" placeholder="如：中山區"/></div></div>
    <div class="row"><div><label>場地名稱 *</label><input id="f場地" placeholder="XX棋牌社"/></div><div><label>場地類型 *</label><select id="f場地類型"><option>公開棋牌社</option><option>私人住宅</option><option>其他</option></select></div></div>
    <div class="row"><div><label>缺額人數 *</label><select id="f缺額"><option>1</option><option selected>2</option><option>3</option></select></div><div><label>開打時間 *</label><input id="f時間" type="datetime-local"/></div></div>
    <label>底/台 金額 *</label>
    <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px">${底台快選.map(function(s){return'<button type="button" class="sq" onclick="document.getElementById(\'f金額\').value=\''+s+'\'">'+s+'</button>'}).join("")}</div>
    <input id="f金額" placeholder="如 300/100"/>
    <label>條件標籤</label><textarea id="f標籤" rows="2" placeholder="用逗號分隔，如：禁菸,有茶水,新手友善"></textarea>
    <div class="hint">可用標籤請參考「📖 使用說明」工作表</div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
      <button class="btn btn-cancel" onclick="google.script.host.close()">取消</button>
      <button class="btn btn-ok" onclick="送出()">發布牌局 🀄</button>
    </div>
    <script>
    function 送出(){
      var d={名稱:document.getElementById("f名稱").value,頭像:document.getElementById("f頭像").value||"🀄",帳號:document.getElementById("f帳號").value,自介:document.getElementById("f自介").value,縣市:document.getElementById("f縣市").value,行政區:document.getElementById("f行政區").value,場地:document.getElementById("f場地").value,場地類型:document.getElementById("f場地類型").value,缺額:document.getElementById("f缺額").value,時間:document.getElementById("f時間").value,金額:document.getElementById("f金額").value,標籤:document.getElementById("f標籤").value};
      if(!d.名稱||!d.帳號||!d.縣市||!d.場地||!d.時間||!d.金額){alert("請填寫所有必填欄位（*）");return}
      google.script.run.withSuccessHandler(function(){google.script.host.close()}).withFailureHandler(function(e){alert("發生錯誤："+e.message)}).寫入新牌局(d);
    }
    </script>
  `).setWidth(480).setHeight(620).setTitle("新增牌局");
  SpreadsheetApp.getUi().showModalDialog(html, "🀄 新增牌局");
}

// ─── 寫入新牌局 ──────────────────────────────────────────────
function 寫入新牌局(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(工作表名稱);
  if (!sheet) throw new Error("找不到工作表「" + 工作表名稱 + "」，請先執行初始化");

  var 最後列 = sheet.getLastRow();
  var 新編號 = 1;
  if (最後列 > 1) {
    var 所有編號 = sheet.getRange(2, 1, 最後列 - 1, 1).getValues();
    for (var i = 0; i < 所有編號.length; i++) {
      var n = parseInt(所有編號[i][0]);
      if (n >= 新編號) 新編號 = n + 1;
    }
  }

  var 時間 = new Date(data.時間);
  var 新資料 = [
    新編號, data.名稱, data.頭像,
    data.帳號.startsWith("@") ? data.帳號 : "@" + data.帳號,
    data.自介, data.縣市, data.行政區, data.場地, data.場地類型,
    parseInt(data.缺額), 0, 時間, data.金額, data.標籤, "招募中", 0
  ];
  sheet.appendRow(新資料);
  var 新列 = sheet.getLastRow();
  sheet.getRange(新列, 12).setNumberFormat("yyyy/mm/dd hh:mm");
  SpreadsheetApp.getUi().alert("✅ 牌局已新增！\n編號：" + 新編號);
}

// ─── 自動更新狀態 ────────────────────────────────────────────
function 自動更新狀態() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(工作表名稱);
  if (!sheet) return;
  var 最後列 = sheet.getLastRow();
  if (最後列 < 2) return;

  var 現在 = new Date();
  var 過期時限 = 2 * 60 * 60 * 1000;
  var 更新數 = 0;

  for (var i = 2; i <= 最後列; i++) {
    var 狀態 = sheet.getRange(i, 15).getValue();
    var 時間 = sheet.getRange(i, 12).getValue();
    if (!時間 || 狀態 === "已停權") continue;

    var 開打時間 = new Date(時間);
    var 時間差 = 現在.getTime() - 開打時間.getTime();

    if (狀態 === "招募中" && 時間差 > 過期時限) { sheet.getRange(i, 15).setValue("已結束"); 更新數++; }

    var 缺額 = parseInt(sheet.getRange(i, 10).getValue()) || 0;
    var 已報名 = parseInt(sheet.getRange(i, 11).getValue()) || 0;
    if (狀態 === "招募中" && 已報名 >= 缺額 && 缺額 > 0) { sheet.getRange(i, 15).setValue("已滿局"); 更新數++; }

    var 檢舉 = parseInt(sheet.getRange(i, 16).getValue()) || 0;
    if (檢舉 >= 3 && 狀態 !== "已停權") { sheet.getRange(i, 15).setValue("已停權"); 更新數++; }
  }

  if (更新數 > 0) { SpreadsheetApp.getUi().alert("✅ 已更新 " + 更新數 + " 筆牌局的狀態"); }
  else { SpreadsheetApp.getUi().alert("目前沒有需要更新的牌局"); }
}

// ─── 清除過期牌局 ────────────────────────────────────────────
function 清除過期牌局() {
  var ui = SpreadsheetApp.getUi();
  var 確認 = ui.alert("⚠️ 清除過期牌局", "此操作會刪除所有狀態為「已結束」的牌局資料。\n確定要繼續嗎？", ui.ButtonSet.YES_NO);
  if (確認 !== ui.Button.YES) return;

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(工作表名稱);
  if (!sheet) return;
  var 最後列 = sheet.getLastRow();
  var 刪除數 = 0;
  for (var i = 最後列; i >= 2; i--) {
    if (sheet.getRange(i, 15).getValue() === "已結束") { sheet.deleteRow(i); 刪除數++; }
  }
  ui.alert("✅ 已清除 " + 刪除數 + " 筆過期牌局");
}

// ─── 牌局統計 ────────────────────────────────────────────────
function 顯示統計() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(工作表名稱);
  if (!sheet || sheet.getLastRow() < 2) { SpreadsheetApp.getUi().alert("目前沒有任何牌局資料"); return; }
  var 最後列 = sheet.getLastRow();
  var 狀態們 = sheet.getRange(2, 15, 最後列 - 1, 1).getValues();
  var 統計 = {"招募中":0,"已滿局":0,"已停權":0,"已結束":0};
  for (var i = 0; i < 狀態們.length; i++) { var s = 狀態們[i][0]; if (統計.hasOwnProperty(s)) 統計[s]++; }
  SpreadsheetApp.getUi().alert("📊 牌局統計",
    "總牌局數：" + (最後列 - 1) + "\n\n🟢 招募中：" + 統計["招募中"] + " 桌\n🔴 已滿局：" + 統計["已滿局"] + " 桌\n🟠 已停權：" + 統計["已停權"] + " 桌\n⚫ 已結束：" + 統計["已結束"] + " 桌",
    SpreadsheetApp.getUi().ButtonSet.OK);
}

// ─── 使用說明 ────────────────────────────────────────────────
function 顯示使用說明() {
  SpreadsheetApp.getUi().alert("❓ 使用說明",
    "🀄 湊咖試算表使用說明\n\n【新增牌局】\n• 使用選單「🀄 湊咖管理 → 新增牌局」\n• 或直接在試算表中手動新增一列\n\n【狀態說明】\n• 招募中：牌局正在找人\n• 已滿局：人數已足夠\n• 已停權：因檢舉被停權\n• 已結束：已過開打時間\n\n【自動功能】\n• 開打 2 小時後自動標記「已結束」\n• 已報名 ≥ 缺額自動標記「已滿局」\n• 檢舉次數 ≥ 3 自動「已停權」\n（需手動執行「更新所有狀態」或設定觸發器）\n\n⚠️ 試算表必須設為公開（知道連結的任何人 → 檢視者）",
    SpreadsheetApp.getUi().ButtonSet.OK);
}

// ─── 使用說明工作表 ──────────────────────────────────────────
function 建立說明工作表(ss) {
  var 說明表名 = "📖 使用說明";
  var existing = ss.getSheetByName(說明表名);
  if (existing) ss.deleteSheet(existing);
  var sheet = ss.insertSheet(說明表名);

  var 內容 = [
    ["🀄 湊咖 — 試算表使用說明","",""],["","",""],
    ["📋 欄位說明","",""],["欄位","說明","範例"],
    ["編號","唯一數字，每筆不同","1"],["主揪暱稱","主揪顯示的名稱","麻將小王子"],
    ["主揪頭像","一個 emoji 圖示","🀄"],["主揪帳號","Threads 帳號（含 @）","@mahjong_prince"],
    ["主揪自介","簡短的自我介紹","打牌十年，歡迎新手"],["縣市","所在縣市","台北市"],
    ["行政區","所在行政區","中山區"],["場地名稱","具體場地名稱","XX棋牌社"],
    ["場地類型","公開棋牌社 / 私人住宅 / 其他","公開棋牌社"],["缺額人數","需要幾個人（1~3）","2"],
    ["已報名","已確認加入的人數","1"],["開打時間","日期與時間","2026/03/25 19:00"],
    ["底台金額","底注/台數金額","300/100"],["條件標籤","用半形逗號分隔","禁菸,有茶水,新手友善"],
    ["狀態","招募中 / 已滿局 / 已停權 / 已結束","招募中"],["檢舉次數","被檢舉的次數（達 3 次自動停權）","0"],
    ["","",""],["🏷️ 可用的條件標籤","",""]
  ];
  for (var 分類 in 所有標籤) { 內容.push([分類, 所有標籤[分類].join("、"), ""]); }
  內容.push(["","",""]);
  內容.push(["⚠️ 注意事項","",""]);
  內容.push(["1. 試算表必須設為「知道連結的任何人 → 檢視者」，前端才能讀取","",""]);
  內容.push(["2. 狀態欄請使用下拉選單選擇，不要手動輸入英文","",""]);
  內容.push(["3. 開打時間格式為 yyyy/mm/dd hh:mm","",""]);
  內容.push(["4. 條件標籤請用半形逗號（,）分隔，不要用頓號（、）","",""]);
  內容.push(["5. 使用「🀄 湊咖管理」選單可以快速新增牌局和更新狀態","",""]);

  sheet.getRange(1, 1, 內容.length, 3).setValues(內容);
  sheet.getRange(1, 1).setFontSize(16).setFontWeight("bold").setFontColor("#e8a838");
  sheet.getRange(3, 1).setFontSize(13).setFontWeight("bold").setFontColor("#e8a838");
  sheet.getRange(4, 1, 1, 3).setFontWeight("bold").setBackground("#1b2030").setFontColor("#e8a838");
  sheet.setColumnWidth(1, 160); sheet.setColumnWidth(2, 400); sheet.setColumnWidth(3, 150);
  sheet.getRange(1, 1, 內容.length, 3).setBackground("#0f1119").setFontColor("#e8eaf0");
  sheet.getRange(4, 1, 1, 3).setBackground("#1b2030").setFontColor("#e8a838");
}

// ─── 背景自動更新（給觸發器用，不顯示彈窗）──────────────────
function 自動更新狀態背景() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(工作表名稱);
  if (!sheet) return;
  var 最後列 = sheet.getLastRow();
  if (最後列 < 2) return;
  var 現在 = new Date();
  var 過期時限 = 2 * 60 * 60 * 1000;

  for (var i = 2; i <= 最後列; i++) {
    var 狀態 = sheet.getRange(i, 15).getValue();
    var 時間 = sheet.getRange(i, 12).getValue();
    if (!時間 || 狀態 === "已停權") continue;
    var 時間差 = 現在.getTime() - new Date(時間).getTime();
    if (狀態 === "招募中" && 時間差 > 過期時限) sheet.getRange(i, 15).setValue("已結束");
    var 缺額 = parseInt(sheet.getRange(i, 10).getValue()) || 0;
    var 已報名 = parseInt(sheet.getRange(i, 11).getValue()) || 0;
    if (狀態 === "招募中" && 已報名 >= 缺額 && 缺額 > 0) sheet.getRange(i, 15).setValue("已滿局");
    var 檢舉 = parseInt(sheet.getRange(i, 16).getValue()) || 0;
    if (檢舉 >= 3 && 狀態 !== "已停權") sheet.getRange(i, 15).setValue("已停權");
  }
}
