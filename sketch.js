let topPoints = [];
let bottomPoints = [];
let midPoints = [];
const numPoints = 5;
let gameState = "START"; // START, PLAYING, WON, LOST
let gameActive = false;  // 是否已經移到起點開始偵測
let difficulty = 1;      // 1: Easy, 2: Medium, 3: Hard
let failReason = "";     // 顯示失敗原因
const margin = 100;      // 左右留出的空間
const cursorRadius = 7.5; // 滑鼠圈圈半徑 (15/2)
let waveTime = 0;        // 用於控制高級模式的扭動時間

function setup() {
  createCanvas(windowWidth, windowHeight);
  // 初始不產生路徑，直到按下開始
}

function draw() {
  background(30);

  if (gameState === "START") {
    drawMenu("電流急急棒", "點擊下方按鈕開始遊戲\n難度將隨表現自動調整");
    drawStartButton();
  } else if (gameState === "PLAYING") {
    drawPath();
    drawMouseCursor(); // 繪製滑鼠跟隨圈
    
    // 只有在遊戲正式開始後，波浪計時器才開始跑
    if (gameActive) {
      waveTime += 0.05;
    }

    // 在頂部告知難度級別
    let diffLabels = ["", "簡單", "中級", "高級"];
    fill(255);
    textSize(24);
    textAlign(CENTER);
    text("當前難度：" + diffLabels[difficulty], width / 2, 40);

    if (!gameActive) {
      fill(255, 255, 0);
      text("← 請點擊綠色起點開始\n跟隨虛線，勿碰邊線", width / 2, 80);
    }
    checkGameLogic();
  } else if (gameState === "WON") {
    drawMenu("恭喜成功！", "點擊畫面重新開始");
  } else if (gameState === "LOST") {
    drawMenu("遊戲失敗！", failReason + "\n點擊畫面再試一次");
  }
}

function getMidlineOffset(x) {
  if (difficulty === 1) return 0;
  if (difficulty === 2) {
    // 中級：波浪 (靜止的 Sine 波，增加曲折感但不會移動)
    return sin(x * 0.03) * 10;
  }
  if (difficulty === 3) {
    // 高級：扭動 (使用 waveTime 控制，點擊起點後才開始變動)
    return sin(waveTime + x * 0.01) * 12;
  }
  return 0;
}

function generatePath() {
  topPoints = [];
  bottomPoints = [];
  midPoints = [];
  let spacing = (width - 2 * margin) / (numPoints - 1);
  
  // 根據難度調整間距
  let minGap = difficulty === 1 ? 80 : (difficulty === 2 ? 65 : 55);
  let maxGap = difficulty === 1 ? 120 : (difficulty === 2 ? 95 : 75);
  
  for (let i = 0; i < numPoints; i++) {
    let x = margin + i * spacing;
    // 隨機產生上方點，保留上下邊距避免太靠邊
    let ty = random(height * 0.2, height * 0.7);
    let gap = random(minGap, maxGap);
    
    topPoints.push(createVector(x, ty));
    bottomPoints.push(createVector(x, ty + gap));
    midPoints.push(createVector(x, ty + gap / 2));
  }
}

function drawPath() {
  // 繪製起點與終點圓圈 (安全區)
  noStroke();
  // 起終點跟隨黃線位置
  let startY = (topPoints[0].y + bottomPoints[0].y) / 2 + getMidlineOffset(topPoints[0].x);
  let endY = (topPoints[numPoints-1].y + bottomPoints[numPoints-1].y) / 2 + getMidlineOffset(topPoints[numPoints-1].x);
  
  fill(0, 255, 0, 100); // 綠色起點
  ellipse(topPoints[0].x, startY, 40);
  fill(255, 0, 0, 100); // 紅色終點
  ellipse(topPoints[numPoints-1].x, endY, 40);

  noFill();
  strokeWeight(3);
  
  // 繪製邊界 (統一顏色)
  stroke(0, 200, 255);
  // 上邊界
  beginShape();
  for (let p of topPoints) {
    vertex(p.x, p.y); // 其餘不動
  }
  endShape();
  
  // 下邊界
  beginShape();
  for (let p of bottomPoints) {
    vertex(p.x, p.y); // 其餘不動
  }
  endShape();

  // 繪製引導中線 (增加繪圖密度以完整呈現波浪或曲折感)
  stroke(255, 255, 0, 200);
  strokeWeight(1);
  drawingContext.setLineDash([5, 5]); // 虛線效果
  beginShape();
  let spacing = (width - 2 * margin) / (numPoints - 1);
  for (let x = margin; x <= width - margin; x += 5) {
    // 計算當前 x 位置在 5 個原始頂點間的基礎 Y 座標
    let idx = floor((x - margin) / spacing);
    idx = constrain(idx, 0, numPoints - 2);
    let pct = (x - (margin + idx * spacing)) / spacing;
    let baseY = lerp(midPoints[idx].y, midPoints[idx + 1].y, pct);
    
    // 加上難度位移
    vertex(x, baseY + getMidlineOffset(x));
  }
  endShape();
  drawingContext.setLineDash([]); // 恢復實線

  fill(255);
  noStroke();
  textSize(16);
  textAlign(CENTER);
  text("起點", topPoints[0].x, startY - 30);
  text("終點", topPoints[numPoints-1].x, endY - 30);
}

function checkGameLogic() {
  let startX = topPoints[0].x;
  let endX = topPoints[numPoints-1].x;
  let startY = (topPoints[0].y + bottomPoints[0].y) / 2 + getMidlineOffset(startX);
  let endY = (topPoints[numPoints-1].y + bottomPoints[numPoints-1].y) / 2 + getMidlineOffset(endX);

  // 1. 如果尚未點擊起點開始，不做碰撞偵測 (點擊邏輯移至 mousePressed)
  if (!gameActive) {
    return;
  }

  // 2. 優先檢查是否抵達終點圓圈 (進入紅色區域即成功，忽略區域內的線)
  if (dist(mouseX, mouseY, endX, endY) < 20) {
    gameState = "WON";
    gameActive = false;
    difficulty = min(3, difficulty + 1); // 成功則變難
    return;
  }

  // 3. 如果在起點圓圈內，視為安全區域，不檢查線條碰撞
  if (dist(mouseX, mouseY, startX, startY) < 20) {
    return;
  }

  // 2. 遊戲進行中的碰撞偵測
  if (mouseX < startX) {
    // 在起點左側：必須待在圓圈內
    if (dist(mouseX, mouseY, startX, startY) > 20) {
      failGame("離開了起點安全區！");
    }
  } else {
    // 在路徑中間：線性插值計算上下界
    let spacing = (width - 2 * margin) / (numPoints - 1);
    let idx = floor((mouseX - margin) / spacing);
    idx = constrain(idx, 0, numPoints - 2);

    let pct = (mouseX - topPoints[idx].x) / spacing;
    
    let currentTopY = lerp(topPoints[idx].y, topPoints[idx+1].y, pct);
    let currentBottomY = lerp(bottomPoints[idx].y, bottomPoints[idx+1].y, pct);
    let currentMidY = lerp(midPoints[idx].y, midPoints[idx+1].y, pct) + getMidlineOffset(mouseX);

    // 碰撞偵測：包含滑鼠圈圈的半徑
    if (mouseY - cursorRadius <= currentTopY || mouseY + cursorRadius >= currentBottomY) {
      failGame("碰到了藍色邊界！");
    }

    // 將判定範圍設定為 25，在挑戰性與容錯率之間取得更好的平衡
    if (abs(mouseY - currentMidY) > 25) {
      failGame("偏離了黃色引導線！");
    }
  }
}

function failGame(reason) {
  gameState = "LOST";
  gameActive = false;
  failReason = reason;
  difficulty = max(1, difficulty - 1); // 失敗則變簡單
}

function drawMouseCursor() {
  push();
  noFill();
  stroke(255);
  strokeWeight(2);
  ellipse(mouseX, mouseY, 15, 15);
  pop();
}

function drawMenu(title, sub) {
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(48);
  text(title, width / 2, height / 2 - 20);
  textSize(20);
  text(sub, width / 2, height / 2 + 40);
}

function drawStartButton() {
  rectMode(CENTER);
  fill(0, 200, 0);
  rect(width / 2, height / 2 + 100, 120, 50, 10);
  fill(255);
  textSize(20);
  text("開始遊戲", width / 2, height / 2 + 100);
}

function mousePressed() {
  if (gameState === "START") {
    // 檢查是否點擊畫面中央的「開始遊戲」按鈕
    if (mouseX > width / 2 - 60 && mouseX < width / 2 + 60 && 
        mouseY > height / 2 + 75 && mouseY < height / 2 + 125) {
      
      if (failReason === "") difficulty = floor(random(1, 4));
      generatePath();
      gameActive = false;
      waveTime = 0; // 重置波浪時間
      gameState = "PLAYING";
    }
  } else if (gameState === "PLAYING" && !gameActive) {
    // 遊戲畫面中，檢查是否點擊起點綠圈
    let startX = topPoints[0].x;
    let startY = (topPoints[0].y + bottomPoints[0].y) / 2 + getMidlineOffset(startX);
    if (dist(mouseX, mouseY, startX, startY) < 20) {
      waveTime = 0; // 從點擊瞬間開始扭動
      gameActive = true;
    }
  } else if (gameState === "WON" || gameState === "LOST") {
    gameState = "START";
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  generatePath();
}
