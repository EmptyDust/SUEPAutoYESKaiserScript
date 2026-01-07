// ==UserScript==
// @name         全自动评教 (列表遍历+自动提交)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  自动遍历所有未评价课程，打满分并提交
// @author       Assistant
// @match        *://*/eams/quality/stdEvaluate*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 随机评语
    const comments = ["课程内容充实", "老师讲解很细致", "获益良多", "教学态度认真", "课堂氛围活跃"];
    const AUTO_STORAGE_KEY = 'auto_eval_running';

    // 延迟执行函数
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // --- 逻辑1：列表页处理 ---
    async function handleListPage() {
        if (localStorage.getItem(AUTO_STORAGE_KEY) !== 'true') return;

        console.log("正在列表页，寻找未评价课程...");
        const rows = document.querySelectorAll('#grid2152356741_data tr, .gridtable tbody tr');
        let targetLink = null;

        for (let row of rows) {
            if (row.innerText.includes('未评价')) {
                targetLink = row.querySelector('a');
                if (targetLink) break;
            }
        }

        if (targetLink) {
            console.log("发现未评价课程，准备跳转...");
            await sleep(1000);
            targetLink.click();
        } else {
            console.log("所有评教已完成！");
            localStorage.removeItem(AUTO_STORAGE_KEY);
            alert("✅ 所有老师已评教完毕！");
            location.reload();
        }
    }

    // --- 逻辑2：评价详情页处理 ---
    async function handleAnswerPage() {
        if (localStorage.getItem(AUTO_STORAGE_KEY) !== 'true') return;

        console.log("进入评价页，开始自动打分...");
        await sleep(1500); // 等待页面加载

        // 1. 填满分数 (10分制)
        const scoreInputs = document.querySelectorAll('input[type="hidden"][name*="score"]');
        scoreInputs.forEach(input => {
            input.value = "10";
        });

        // 2. 填写建议
        const textarea = document.querySelector('textarea[name*="content"]');
        if (textarea) {
            textarea.value = comments[Math.floor(Math.random() * comments.length)];
        }

        // 3. 模拟点击星星（可选，增强兼容性）
        document.querySelectorAll('.star_score').forEach(block => {
            const stars = block.querySelectorAll('a');
            if (stars.length > 0) stars[stars.length - 1].click();
        });

        console.log("打分完成，3秒后自动提交...");
        await sleep(2000);

        // 4. 调用网页自带的提交函数
        if (typeof submit === 'function') {
            submit();
        } else {
            const subBtn = document.getElementById('submitButton') || document.querySelector('input[value="提交"]');
            if (subBtn) subBtn.click();
        }
    }

    // --- 逻辑3：UI控制 ---
    function createUI() {
        const btn = document.createElement('button');
        const isRunning = localStorage.getItem(AUTO_STORAGE_KEY) === 'true';

        btn.innerHTML = isRunning ? '停止全自动评教' : '🚩 开启全自动评教';
        btn.style.cssText = `position:fixed;top:10px;right:10px;z-index:9999;padding:12px 20px;
                            background:${isRunning ? '#f44336' : '#2196F3'};color:white;
                            border:none;border-radius:25px;cursor:pointer;font-weight:bold;box-shadow:0 4px 6px rgba(0,0,0,0.3)`;

        btn.onclick = () => {
            if (localStorage.getItem(AUTO_STORAGE_KEY) === 'true') {
                localStorage.removeItem(AUTO_STORAGE_KEY);
                location.reload();
            } else {
                localStorage.setItem(AUTO_STORAGE_KEY, 'true');
                handleListPage();
            }
        };
        document.body.appendChild(btn);
    }

    // --- 入口判断 ---
    const currentUrl = window.location.href;
    if (currentUrl.includes('!answer.action')) {
        handleAnswerPage();
    } else {
        createUI();
        if (localStorage.getItem(AUTO_STORAGE_KEY) === 'true') {
            handleListPage();
        }
    }

})();
