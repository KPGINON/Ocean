// 全局变量
let materials = [];
let currentPage = 'overview';
let selectedMaterials = new Set();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeMenuNavigation();
    initializeUpload();
    initializeMaterialsTable();
    initializeSearch();
    initializeNotifications();
    initializeThemeToggle();
    loadMaterials();
    updateDashboard();
});

// 菜单导航功能
function initializeMenuNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetPage = this.getAttribute('data-page');
            
            // 移除所有活动状态
            menuItems.forEach(mi => mi.classList.remove('active'));
            document.querySelectorAll('.page-content').forEach(pc => pc.classList.remove('active'));
            
            // 添加当前活动状态
            this.classList.add('active');
            document.getElementById(targetPage).classList.add('active');
            
            currentPage = targetPage;
            updatePageContent(targetPage);
            
            // 移动端自动关闭侧边栏
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
            }
        });
    });
    
    // 移动端菜单切换
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
    
    // 点击外部关闭侧边栏
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768 && 
            !sidebar.contains(e.target) && 
            !mobileMenuToggle.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });
}

// 切换菜单部分
function toggleMenuSection(header) {
    const menuItems = header.nextElementSibling;
    const isCollapsed = header.classList.contains('collapsed');
    
    if (isCollapsed) {
        header.classList.remove('collapsed');
        menuItems.style.display = 'block';
        menuItems.style.opacity = '0';
        menuItems.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            menuItems.style.transition = 'all 0.3s ease';
            menuItems.style.opacity = '1';
            menuItems.style.transform = 'translateY(0)';
        }, 10);
    } else {
        header.classList.add('collapsed');
        menuItems.style.transition = 'all 0.3s ease';
        menuItems.style.opacity = '0';
        menuItems.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            menuItems.style.display = 'none';
        }, 300);
    }
}

// 更新页面内容
function updatePageContent(page) {
    switch(page) {
        case 'overview':
            updateDashboard();
            break;
        case 'materials':
            updateMaterialsTable();
            break;
        case 'upload':
            // 上传页面已初始化
            break;
        case 'pre-audit':
            initializePreAudit();
            break;
        case 'pre-test':
            initializePreTest();
            break;
        case 'violation-detection':
            initializeViolationDetection();
            break;
        case 'quick-approve':
            initializeQuickApprove();
            break;
        case 'post-consumption':
            initializePostConsumption();
            break;
        case 'expansion':
            initializeExpansion();
            break;
        default:
            // 其他页面可以在这里添加特定逻辑
            console.log(`切换到页面: ${page}`);
    }
}

// 初始化上传功能
function initializeUpload() {
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    
    if (uploadBtn) {
        uploadBtn.addEventListener('click', handleUpload);
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    // 拖拽上传
    const uploadBox = document.querySelector('.upload-box');
    if (uploadBox) {
        uploadBox.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadBox.style.borderColor = '#667eea';
        });
        
        uploadBox.addEventListener('dragleave', () => {
            uploadBox.style.borderColor = '#bdc3c7';
        });
        
        uploadBox.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadBox.style.borderColor = '#bdc3c7';
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                handleFileSelect();
            }
        });
    }
}

// 处理文件选择
function handleFileSelect() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (file) {
        const nameInput = document.getElementById('materialName');
        if (nameInput && !nameInput.value) {
            nameInput.value = file.name.split('.')[0];
        }
    }
}

// 处理上传
async function handleUpload() {
    const fileInput = document.getElementById('fileInput');
    const nameInput = document.getElementById('materialName');
    const typeSelect = document.getElementById('materialType');
    const categorySelect = document.getElementById('materialCategory');
    const clientInput = document.getElementById('materialClient');
    const descriptionInput = document.getElementById('materialDescription');
    const tagsInput = document.getElementById('materialTags');
    
    // 表单验证
    if (!fileInput || !fileInput.files[0]) {
        showNotification('请选择要上传的文件', 'warning');
        return;
    }
    
    if (!nameInput || !nameInput.value) {
        showNotification('请输入素材名称', 'warning');
        return;
    }
    
    if (!typeSelect || !typeSelect.value) {
        showNotification('请选择素材类型', 'warning');
        return;
    }
    
    if (!categorySelect || !categorySelect.value) {
        showNotification('请选择素材分类', 'warning');
        return;
    }
    
    const file = fileInput.files[0];
    const materialData = {
        name: nameInput.value,
        type: typeSelect.value,
        category: categorySelect.value,
        client: clientInput.value || '未知客户',
        description: descriptionInput.value || '',
        tags: tagsInput.value ? tagsInput.value.split(',').map(tag => tag.trim()) : [],
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        lastModified: file.lastModified
    };
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('data', JSON.stringify(materialData));
    
    try {
        showNotification('正在上传素材...', 'info');
        
        const response = await fetch('/api/materials/upload', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification('素材上传成功！', 'success');
            
            // 清空表单
            resetUploadForm();
            
            // 重新加载数据
            loadMaterials();
            updateDashboard();
        } else {
            const error = await response.json();
            showNotification('上传失败：' + (error.message || '请重试'), 'error');
        }
    } catch (error) {
        console.error('上传失败:', error);
        showNotification('上传失败，请检查网络连接', 'error');
    }
}

// 重置上传表单
function resetUploadForm() {
    const fileInput = document.getElementById('fileInput');
    const nameInput = document.getElementById('materialName');
    const typeSelect = document.getElementById('materialType');
    const categorySelect = document.getElementById('materialCategory');
    const clientInput = document.getElementById('materialClient');
    const descriptionInput = document.getElementById('materialDescription');
    const tagsInput = document.getElementById('materialTags');
    
    if (fileInput) fileInput.value = '';
    if (nameInput) nameInput.value = '';
    if (typeSelect) typeSelect.value = '';
    if (categorySelect) categorySelect.value = '';
    if (clientInput) clientInput.value = '';
    if (descriptionInput) descriptionInput.value = '';
    if (tagsInput) tagsInput.value = '';
}

// 初始化素材表格
function initializeMaterialsTable() {
    const selectAll = document.getElementById('selectAll');
    const statusFilter = document.getElementById('statusFilter');
    const typeFilter = document.getElementById('typeFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const dateFilter = document.getElementById('dateFilter');
    const clientFilter = document.getElementById('clientFilter');
    
    if (selectAll) {
        selectAll.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]');
            checkboxes.forEach(cb => cb.checked = this.checked);
            updateSelectedMaterials();
        });
    }
    
    // 筛选功能
    [statusFilter, typeFilter, categoryFilter, dateFilter, clientFilter].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', updateMaterialsTable);
            if (filter.type === 'text' || filter.type === 'date') {
                filter.addEventListener('input', updateMaterialsTable);
            }
        }
    });
    
    // 批量操作按钮
    const batchButtons = document.querySelectorAll('.btn-batch');
    batchButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.textContent.trim();
            handleBatchAction(action);
        });
    });
}

// 更新素材表格
function updateMaterialsTable() {
    const tbody = document.getElementById('materialsTableBody');
    if (!tbody) return;
    
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const typeFilter = document.getElementById('typeFilter')?.value || 'all';
    const categoryFilter = document.getElementById('categoryFilter')?.value || 'all';
    const dateFilter = document.getElementById('dateFilter')?.value || '';
    const clientFilter = document.getElementById('clientFilter')?.value || '';
    
    let filteredMaterials = materials.filter(material => {
        if (statusFilter !== 'all' && material.status !== statusFilter) return false;
        if (typeFilter !== 'all' && material.type !== typeFilter) return false;
        if (categoryFilter !== 'all' && material.category !== categoryFilter) return false;
        if (dateFilter && material.createdAt !== dateFilter) return false;
        if (clientFilter && !material.name.toLowerCase().includes(clientFilter.toLowerCase()) && 
            !material.fileName.toLowerCase().includes(clientFilter.toLowerCase())) return false;
        return true;
    });
    
    tbody.innerHTML = filteredMaterials.map(material => `
        <tr>
            <td><input type="checkbox" data-material-id="${material.id}" onchange="updateSelectedMaterials()"></td>
            <td>AD${material.id.toString().padStart(6, '0')}</td>
            <td>
                <div class="file-info">
                    <div class="file-name">${material.name}</div>
                    <div class="file-name-original">${material.fileName || material.name}</div>
                </div>
            </td>
            <td><span class="category-badge category-${material.category}">${getCategoryLabel(material.category)}</span></td>
            <td>
                <div class="file-details">
                    <div class="file-type">
                        <i class="fas fa-${getFileIcon(material.type)}"></i>
                        ${getTypeLabel(material.type)}
                    </div>
                    <div class="file-size">${formatFileSize(material.fileSize)}</div>
                </div>
            </td>
            <td>${new Date(material.createdAt).toLocaleString()}</td>
            <td><span class="status-badge status-${material.status}">${getStatusLabel(material.status)}</span></td>
            <td>${getComplianceLabel(material.compliance)}</td>
            <td>${getPredictionLabel(material.prediction)}</td>
            <td>¥${material.spend.toLocaleString()}</td>
            <td>
                <button class="btn-action" onclick="viewMaterial(${material.id})" title="查看详情">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-action" onclick="retestMaterial(${material.id})" title="重新测试">
                    <i class="fas fa-redo"></i>
                </button>
                <button class="btn-action" onclick="expandMaterial(${material.id})" title="裂变">
                    <i class="fas fa-magic"></i>
                </button>
                <button class="btn-action" onclick="downloadMaterial(${material.id})" title="下载">
                    <i class="fas fa-download"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// 更新选中素材
function updateSelectedMaterials() {
    selectedMaterials.clear();
    const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]:checked');
    checkboxes.forEach(cb => {
        selectedMaterials.add(parseInt(cb.getAttribute('data-material-id')));
    });
}

// 处理批量操作
function handleBatchAction(action) {
    if (selectedMaterials.size === 0) {
        showNotification('请先选择要操作的素材', 'warning');
        return;
    }
    
    switch(action) {
        case '全选':
            document.getElementById('selectAll').checked = true;
            document.querySelectorAll('tbody input[type="checkbox"]').forEach(cb => cb.checked = true);
            updateSelectedMaterials();
            break;
        case '批量下线':
            if (confirm(`确定要下线选中的 ${selectedMaterials.size} 个素材吗？`)) {
                batchOfflineMaterials();
            }
            break;
        case '批量裂变':
            if (confirm(`确定要对选中的 ${selectedMaterials.size} 个素材进行裂变吗？`)) {
                batchExpandMaterials();
            }
            break;
    }
}

// 批量下线素材
async function batchOfflineMaterials() {
    try {
        for (let id of selectedMaterials) {
            await fetch(`/api/materials/${id}`, { method: 'DELETE' });
        }
        showNotification(`成功下线 ${selectedMaterials.size} 个素材`, 'success');
        loadMaterials();
        updateMaterialsTable();
    } catch (error) {
        console.error('批量下线失败:', error);
        showNotification('批量下线失败，请重试', 'error');
    }
}

// 批量裂变素材
async function batchExpandMaterials() {
    showNotification(`正在对 ${selectedMaterials.size} 个素材进行裂变...`, 'info');
    // 这里可以添加裂变逻辑
    setTimeout(() => {
        showNotification(`成功生成 ${selectedMaterials.size * 3} 个裂变素材`, 'success');
    }, 2000);
}

// 初始化搜索功能
function initializeSearch() {
    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            if (query.length > 2) {
                searchMaterials(query);
            } else {
                updateMaterialsTable();
            }
        });
    }
}

// 搜索素材
function searchMaterials(query) {
    const results = materials.filter(material => 
        material.name.toLowerCase().includes(query) ||
        material.id.toString().includes(query) ||
        (material.uploader && material.uploader.toLowerCase().includes(query))
    );
    
    console.log(`搜索结果: ${results.length} 个素材`);
    // 可以在这里更新表格显示搜索结果
}

// 初始化通知功能
function initializeNotifications() {
    const violationAlert = document.getElementById('violationAlert');
    const systemAlert = document.getElementById('systemAlert');
    
    if (violationAlert) {
        violationAlert.addEventListener('click', () => {
            showNotification('有3个违规素材需要处理', 'warning');
        });
    }
    
    if (systemAlert) {
        systemAlert.addEventListener('click', () => {
            showNotification('有1个系统通知', 'info');
        });
    }
}

// 初始化主题切换
function initializeThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    
    // 检查本地存储的主题设置
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-theme');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            body.classList.toggle('dark-theme');
            const isDark = body.classList.contains('dark-theme');
            
            // 更新图标
            themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
            
            // 保存主题设置
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            
            // 显示切换通知
            showNotification(`已切换到${isDark ? '深色' : '浅色'}主题`, 'success');
        });
    }
}

// 显示通知
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 3秒后自动移除
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// 获取通知图标
function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// 投前模块功能
// 素材预审功能
function initializePreAudit() {
    console.log('素材预审页面已加载');
    loadPreAuditStats();
    loadRecentAudits();
}

// 加载预审统计数据
async function loadPreAuditStats() {
    try {
        const response = await fetch('/api/pre-audit/stats');
        const result = await response.json();
        
        if (result.code === 0) {
            const stats = result.data;
            const totalElement = document.getElementById('totalAuditCount');
            const successElement = document.getElementById('successAuditCount');
            const rateElement = document.getElementById('auditSuccessRate');
            
            if (totalElement) totalElement.textContent = stats.total || 0;
            if (successElement) successElement.textContent = stats.success || 0;
            if (rateElement) rateElement.textContent = `${stats.success_rate || 0}%`;
        }
    } catch (error) {
        console.error('加载预审统计失败:', error);
    }
}

// 加载最近预审记录
async function loadRecentAudits() {
    const container = document.getElementById('recentAudits');
    if (!container) return;
    
    try {
        const response = await fetch('/api/pre-audit/recent');
        const result = await response.json();
        
        if (result.code === 0) {
            const audits = result.data || [];
            container.innerHTML = audits.map(audit => `
                <div class="audit-item">
                    <div>
                        <div class="audit-id">任务ID: ${audit.task_id}</div>
                        <div class="audit-time">${new Date(audit.created_at).toLocaleString()}</div>
                    </div>
                    <div class="audit-status status-${audit.status === 'success' ? 'approved' : audit.status === 'failed' ? 'rejected' : 'pending'}">
                        ${audit.status === 'success' ? '成功' : audit.status === 'failed' ? '失败' : '审核中'}
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('加载最近预审失败:', error);
    }
}

// 提交预审
async function submitPreAudit() {
    const accountId = document.getElementById('preAuditAccountId').value;
    const videoId = document.getElementById('preAuditVideoId').value;
    
    if (!accountId || !videoId) {
        showNotification('请填写完整的预审信息', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/pre-audit/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                account_id: accountId,
                video_id: videoId,
                business_type: 'QIAN_CHUAN',
                type: 'VIDEO',
                msg_type: 'SEND'
            })
        });
        
        const result = await response.json();
        
        if (result.code === 0) {
            showNotification('预审提交成功，任务ID: ' + result.data.task_id, 'success');
            loadPreAuditStats();
            loadRecentAudits();
        } else {
            showNotification('预审提交失败: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('预审提交失败:', error);
        showNotification('预审提交失败，请重试', 'error');
    }
}

// 素材前测功能
function initializePreTest() {
    console.log('素材前测页面已加载');
    loadPreTestMaterials();
}

// 加载前测素材
async function loadPreTestMaterials() {
    const container = document.getElementById('preTestMaterials');
    if (!container) return;
    
    try {
        const response = await fetch('/api/pre-test/materials');
        const result = await response.json();
        
        if (result.code === 0) {
            const materials = result.data || [];
            container.innerHTML = materials.map(material => `
                <div class="material-card">
                    <div class="material-header">
                        <h4>${material.name}</h4>
                        <span class="status-badge status-${material.status}">
                            ${material.status === 'tested' ? '已测试' : '待测试'}
                        </span>
                    </div>
                    <div class="material-body">
                        <div class="material-info">
                            <div>类型: ${material.type}</div>
                            <div>创建时间: ${new Date(material.created_at).toLocaleString()}</div>
                        </div>
                        <div class="test-actions">
                            <button class="btn btn-primary" onclick="startPreTest(${material.id})">
                                开始测试
                            </button>
                            <button class="btn btn-secondary" onclick="viewTestResult(${material.id})">
                                查看结果
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('加载前测素材失败:', error);
    }
}

// 开始前测
async function startPreTest(materialId) {
    try {
        const response = await fetch(`/api/pre-test/start/${materialId}`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.code === 0) {
            showNotification('前测已开始', 'success');
            setTimeout(() => {
                simulateTestResult(materialId);
            }, 3000);
        } else {
            showNotification('前测启动失败', 'error');
        }
    } catch (error) {
        console.error('前测启动失败:', error);
        showNotification('前测启动失败，请重试', 'error');
    }
}

// 模拟测试结果
function simulateTestResult(materialId) {
    const tags = ['优质', '高效', '首发'];
    const result = {
        quality_score: Math.floor(Math.random() * 40) + 60,
        efficiency_score: Math.floor(Math.random() * 30) + 70,
        tags: tags.slice(0, Math.floor(Math.random() * tags.length) + 1)
    };
    
    showNotification(`测试完成！质量评分: ${result.quality_score}, 效率评分: ${result.efficiency_score}`, 'success');
    
    // 更新素材状态
    const material = materials.find(m => m.id === materialId);
    if (material) {
        material.test_result = result;
        material.status = 'tested';
    }
    
    loadPreTestMaterials();
}

// 查看测试结果
function viewTestResult(materialId) {
    const material = materials.find(m => m.id === materialId);
    if (!material || !material.test_result) {
        showNotification('暂无测试结果', 'warning');
        return;
    }
    
    const result = material.test_result;
    showNotification(`质量评分: ${result.quality_score}, 效率评分: ${result.efficiency_score}, 标签: ${result.tags.join(', ')}`, 'info');
}

// 投后模块功能
// 违规检测功能
function initializeViolationDetection() {
    console.log('违规检测页面已加载');
    loadViolationStats();
    loadViolationResults();
}

// 加载违规统计数据
async function loadViolationStats() {
    try {
        const response = await fetch('/api/violation/stats');
        const result = await response.json();
        
        if (result.code === 0) {
            const stats = result.data;
            const totalElement = document.getElementById('totalViolationCount');
            const todayElement = document.getElementById('todayViolationCount');
            const rateElement = document.getElementById('violationRate');
            
            if (totalElement) totalElement.textContent = stats.total || 0;
            if (todayElement) todayElement.textContent = stats.today || 0;
            if (rateElement) rateElement.textContent = `${stats.violation_rate || 0}%`;
        }
    } catch (error) {
        console.error('加载违规统计失败:', error);
    }
}

// 加载违规检测结果
async function loadViolationResults() {
    const container = document.getElementById('violationResults');
    if (!container) return;
    
    try {
        const response = await fetch('/api/violation/results');
        const result = await response.json();
        
        if (result.code === 0) {
            const violations = result.data || [];
            container.innerHTML = violations.map(violation => `
                <div class="violation-item">
                    <div class="violation-header">
                        <div>
                            <div class="violation-title">素材ID: ${violation.material_id}</div>
                            <div class="violation-time">${new Date(violation.detected_at).toLocaleString()}</div>
                        </div>
                        <div class="violation-status status-rejected">
                            违规
                        </div>
                    </div>
                    <div class="violation-details">
                        <div>关联广告ID: ${violation.promotion_id}</div>
                        <div>违规原因: ${violation.violation_reason}</div>
                    </div>
                    <div class="violation-actions">
                        <button class="btn btn-primary" onclick="viewViolationDetail(${violation.id})">
                            查看详情
                        </button>
                        <button class="btn btn-danger" onclick="handleViolation(${violation.id})">
                            处理违规
                        </button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('加载违规结果失败:', error);
    }
}

// 开始违规检测
async function startViolationDetection() {
    const agentId = document.getElementById('agentId').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!agentId || !startDate || !endDate) {
        showNotification('请填写完整的检测信息', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/violation/detect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                agent_id: agentId,
                start_date: startDate,
                end_date: endDate,
                business_type: 'AD'
            })
        });
        
        const result = await response.json();
        
        if (result.code === 0) {
            showNotification('违规检测已启动', 'success');
            setTimeout(() => {
                loadViolationResults();
            }, 2000);
        } else {
            showNotification('违规检测启动失败', 'error');
        }
    } catch (error) {
        console.error('违规检测启动失败:', error);
        showNotification('违规检测启动失败，请重试', 'error');
    }
}

// 一键过审功能
function initializeQuickApprove() {
    console.log('一键过审页面已加载');
    showNotification('一键过审功能正在开发中', 'info');
}

// 投后消耗功能
function initializePostConsumption() {
    console.log('投后消耗页面已加载');
    loadConsumptionData();
}

// 加载消耗数据
async function loadConsumptionData() {
    const container = document.getElementById('consumptionData');
    if (!container) return;
    
    try {
        const response = await fetch('/api/consumption/data');
        const result = await response.json();
        
        if (result.code === 0) {
            const data = result.data || [];
            container.innerHTML = data.map(item => `
                <div class="consumption-item">
                    <div class="consumption-header">
                        <h4>素材ID: ${item.material_id}</h4>
                        <span class="status-badge status-effective">
                            投放中
                        </span>
                    </div>
                    <div class="consumption-details">
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">消耗金额</span>
                                <span class="detail-value">¥${item.spend.toLocaleString()}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">返点比例</span>
                                <span class="detail-value">${item.rebate_rate}%</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">返点上限</span>
                                <span class="detail-value">¥${item.rebate_limit.toLocaleString()}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">返点金额</span>
                                <span class="detail-value">¥${item.rebate_amount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('加载消耗数据失败:', error);
    }
}

// 爆款裂变功能
function initializeExpansion() {
    console.log('爆款裂变页面已加载');
    showNotification('爆款裂变功能正在开发中', 'info');
}

// 加载素材数据
async function loadMaterials() {
    try {
        const response = await fetch('/api/materials');
        materials = await response.json();
        updateMaterialsTable();
    } catch (error) {
        console.error('加载素材失败:', error);
    }
}

// 更新仪表板
function updateDashboard() {
    updateStats();
    updateCharts();
    updateAlerts();
}

// 更新统计数据
function updateStats() {
    const totalMaterials = materials.length;
    const approvedMaterials = materials.filter(m => m.compliance === 'passed').length;
    const violationMaterials = materials.filter(m => m.violations && m.violations.length > 0).length;
    const totalSpend = materials.reduce((sum, m) => sum + m.spend, 0);
    const totalCtr = materials.reduce((sum, m) => sum + m.ctr, 0);
    const avgCtr = materials.length > 0 ? totalCtr / materials.length : 0;
    
    // 更新DOM
    const statValues = document.querySelectorAll('.stat-value');
    if (statValues.length >= 4) {
        statValues[0].textContent = totalMaterials.toLocaleString();
        statValues[1].textContent = totalMaterials > 0 ? `${((approvedMaterials / totalMaterials) * 100).toFixed(1)}%` : '0%';
        statValues[2].textContent = totalMaterials > 0 ? `${((violationMaterials / totalMaterials) * 100).toFixed(1)}%` : '0%';
        statValues[3].textContent = `${avgCtr.toFixed(1)}%`;
    }
}

// 更新图表
function updateCharts() {
    // 这里可以集成图表库如 Chart.js 或 ECharts
    console.log('更新图表数据');
}

// 更新提醒
function updateAlerts() {
    // 这里可以动态更新提醒内容
    console.log('更新提醒信息');
}

// 辅助函数
function getStatusLabel(status) {
    const labels = {
        'pending': '待审核',
        'approved': '已通过',
        'rejected': '已拒绝',
        'flagged': '违规',
        'testing': '测试中'
    };
    return labels[status] || status;
}

function getFileIcon(type) {
    const icons = {
        'image': 'image',
        'video': 'video',
        'audio': 'music',
        'text': 'file-alt',
        'document': 'file-pdf',
        'archive': 'file-archive'
    };
    return icons[type] || 'file';
}

function getTypeLabel(type) {
    const labels = {
        'image': '图片',
        'video': '视频',
        'audio': '音频',
        'text': '文案',
        'document': '文档',
        'archive': '压缩包'
    };
    return labels[type] || type;
}

function getCategoryLabel(category) {
    const labels = {
        'product': '产品展示',
        'brand': '品牌宣传',
        'activity': '活动推广',
        'education': '教育内容',
        'entertainment': '娱乐内容',
        'news': '新闻资讯',
        'service': '服务介绍',
        'other': '其他'
    };
    return labels[category] || category;
}

function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getComplianceLabel(compliance) {
    const labels = {
        'passed': '通过',
        'failed': '未通过',
        'pending': '待审核'
    };
    return labels[compliance] || compliance;
}

function getPredictionLabel(prediction) {
    const labels = {
        'high_quality': '高质量',
        'medium_quality': '中等质量',
        'low_quality': '低质量',
        'pending': '待预测'
    };
    return labels[prediction] || prediction;
}

// 素材操作函数
function viewMaterial(id) {
    const material = materials.find(m => m.id === id);
    if (material) {
        showMaterialDetailModal(material);
    }
}

function retestMaterial(id) {
    showNotification(`重新检测素材 #AD${id.toString().padStart(6, '0')}`, 'info');
}

function expandMaterial(id) {
    showNotification(`裂变素材 #AD${id.toString().padStart(6, '0')}`, 'info');
}

function downloadMaterial(id) {
    const material = materials.find(m => m.id === id);
    if (material) {
        showNotification(`正在下载素材: ${material.name}`, 'info');
        // 这里可以实现实际的下载功能
    }
}

// 显示素材详情弹窗
function showMaterialDetailModal(material) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>素材详情</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="detail-section">
                    <h4>基本信息</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">素材ID</span>
                            <span class="detail-value">AD${material.id.toString().padStart(6, '0')}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">素材名称</span>
                            <span class="detail-value">${material.name}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">文件名</span>
                            <span class="detail-value">${material.fileName || material.name}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">素材类型</span>
                            <span class="detail-value">
                                <i class="fas fa-${getFileIcon(material.type)}"></i>
                                ${getTypeLabel(material.type)}
                            </span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">素材分类</span>
                            <span class="detail-value">${getCategoryLabel(material.category)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">客户名称</span>
                            <span class="detail-value">${material.client || '未知客户'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">文件大小</span>
                            <span class="detail-value">${formatFileSize(material.fileSize)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">创建时间</span>
                            <span class="detail-value">${new Date(material.createdAt).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                
                ${material.description ? `
                    <div class="detail-section">
                        <h4>素材描述</h4>
                        <div class="result-reason">
                            <p>${material.description}</p>
                        </div>
                    </div>
                ` : ''}
                
                ${material.tags && material.tags.length > 0 ? `
                    <div class="detail-section">
                        <h4>标签</h4>
                        <div class="tags-container">
                            ${material.tags.map(tag => `<span class="tag-badge">${tag}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="detail-section">
                    <h4>状态信息</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">素材状态</span>
                            <span class="detail-value">
                                <span class="status-badge status-${material.status}">
                                    ${getStatusLabel(material.status)}
                                </span>
                            </span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">预审结果</span>
                            <span class="detail-value">${getComplianceLabel(material.compliance)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">前测预测</span>
                            <span class="detail-value">${getPredictionLabel(material.prediction)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">消耗金额</span>
                            <span class="detail-value">¥${material.spend.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">关闭</button>
                <button class="btn btn-primary" onclick="downloadMaterial(${material.id})">
                    <i class="fas fa-download"></i> 下载素材
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 点击背景关闭
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// 添加通知样式
const notificationStyles = `
.notification {
    position: fixed;
    top: 80px;
    right: 20px;
    background: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 1001;
    animation: slideIn 0.3s ease;
}

.notification-success {
    border-left: 4px solid #27ae60;
    color: #27ae60;
}

.notification-error {
    border-left: 4px solid #e74c3c;
    color: #e74c3c;
}

.notification-warning {
    border-left: 4px solid #f39c12;
    color: #f39c12;
}

.notification-info {
    border-left: 4px solid #3498db;
    color: #3498db;
}

@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

.status-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

.status-pending { background: #fff3cd; color: #856404; }
.status-approved { background: #d4edda; color: #155724; }
.status-rejected { background: #f8d7da; color: #721c24; }
.status-flagged { background: #f8d7da; color: #721c24; }
.status-testing { background: #d1ecf1; color: #0c5460; }

.btn-action {
    background: none;
    border: none;
    color: #667eea;
    cursor: pointer;
    padding: 5px;
    margin: 0 2px;
    border-radius: 4px;
    transition: background 0.3s;
}

.btn-action:hover {
    background: rgba(102, 126, 234, 0.1);
}
`;

// 快速千川预审功能
function quickQianchuanAudit() {
    const videoId = document.getElementById('quickVideoId').value;
    const accountId = document.getElementById('quickAccountId').value;
    
    if (!videoId || !accountId) {
        showNotification('请填写视频ID和广告主ID', 'error');
        return;
    }
    
    // 调用千川预审API
    fetch('/api/qianchuan/audit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            account_id: accountId,
            video_id: videoId,
            access_token: 'mock_access_token_123',
            msg_type: 'SEND'
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result.code === 0) {
            showNotification(`预审请求已发送，任务ID: ${result.data.task_id}`, 'success');
            
            // 模拟状态更新
            setTimeout(() => {
                const material = materials.find(m => m.id == videoId);
                if (material) {
                    material.compliance = Math.random() > 0.3 ? 'passed' : 'failed';
                    material.status = material.compliance === 'passed' ? 'approved' : 'flagged';
                    material.qianchuan_task_id = result.data.task_id;
                    
                    if (material.compliance === 'failed') {
                        material.violations = ['content_violation', 'policy_breach'];
                    }
                    
                    showNotification(`素材 ${videoId} 预审完成，结果: ${material.compliance === 'passed' ? '通过' : '拒绝'}`, 
                                   material.compliance === 'passed' ? 'success' : 'error');
                }
            }, 3000);
        } else {
            showNotification('预审请求失败', 'error');
        }
    })
    .catch(error => {
        console.error('预审失败:', error);
        showNotification('预审请求失败', 'error');
    });
}


// 千川预审功能
async function startQianchuanSingleAudit() {
    const accountId = document.getElementById('qcAccountId').value;
    const accessToken = document.getElementById('qcAccessToken').value;
    const videoId = document.getElementById('qcVideoId').value;
    const msgType = document.getElementById('qcMsgType').value;

    if (!accountId || !accessToken || !videoId) {
        showNotification('请填写完整的千川API配置信息', 'error');
        return;
    }

    const resultsContainer = document.getElementById('resultsContainer');
    showLoadingState(resultsContainer, '正在处理千川单个预审...');

    try {
        const response = await fetch('/api/qianchuan/audit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                account_id: accountId,
                video_id: videoId,
                access_token: accessToken,
                msg_type: msgType
            })
        });

        const result = await response.json();
        
        const testResult = {
            title: '千川单个预审',
            status: result.code === 0 ? 'success' : 'error',
            details: `广告主ID: ${accountId}, 视频ID: ${videoId}, 操作: ${msgType}`,
            result: result,
            time: new Date().toLocaleString()
        };

        addTestResult(testResult);
        showNotification('千川单个预审请求已发送', 'success');

        // 模拟状态更新
        setTimeout(() => {
            const statusResult = {
                title: '预审状态更新',
                status: Math.random() > 0.3 ? 'success' : 'error',
                details: `预审结果: ${Math.random() > 0.3 ? '通过' : '拒绝'}`,
                time: new Date().toLocaleString()
            };
            addTestResult(statusResult);
        }, 3000);

    } catch (error) {
        console.error('千川预审失败:', error);
        showNotification('千川预审失败，请重试', 'error');
        
        const errorResult = {
            title: '千川单个预审',
            status: 'error',
            details: `预审失败: ${error.message}`,
            time: new Date().toLocaleString()
        };
        addTestResult(errorResult);
    }
}

async function startQianchuanBatchAudit() {
    const accountId = document.getElementById('qcAccountId').value;
    const accessToken = document.getElementById('qcAccessToken').value;

    if (!accountId || !accessToken) {
        showNotification('请填写完整的千川API配置信息', 'error');
        return;
    }

    const resultsContainer = document.getElementById('resultsContainer');
    showLoadingState(resultsContainer, '正在处理千川批量预审...');

    try {
        const videoIds = ['2', '5', '8']; // 模拟多个视频ID

        const response = await fetch('/api/qianchuan/batch-audit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                account_id: accountId,
                video_ids: videoIds,
                access_token: accessToken
            })
        });

        const result = await response.json();
        
        const testResult = {
            title: '千川批量预审',
            status: result.code === 0 ? 'success' : 'error',
            details: `广告主ID: ${accountId}, 批量预审 ${videoIds.length} 个视频`,
            result: result,
            time: new Date().toLocaleString()
        };

        addTestResult(testResult);
        showNotification('千川批量预审请求已发送', 'success');

        // 模拟批量处理完成
        setTimeout(() => {
            const successCount = Math.floor(Math.random() * videoIds.length) + 1;
            const failedCount = videoIds.length - successCount;
            
            const batchResult = {
                title: '批量预审完成',
                status: failedCount === 0 ? 'success' : successCount > 0 ? 'warning' : 'error',
                details: `成功: ${successCount} 个, 失败: ${failedCount} 个`,
                time: new Date().toLocaleString()
            };
            addTestResult(batchResult);
        }, 5000);

    } catch (error) {
        console.error('千川批量预审失败:', error);
        showNotification('千川批量预审失败，请重试', 'error');
        
        const errorResult = {
            title: '千川批量预审',
            status: 'error',
            details: `批量预审失败: ${error.message}`,
            time: new Date().toLocaleString()
        };
        addTestResult(errorResult);
    }
}

async function startQianchuanStatusQuery() {
    const taskId = prompt('请输入要查询的千川预审任务ID:');
    if (!taskId) return;

    const resultsContainer = document.getElementById('resultsContainer');
    showLoadingState(resultsContainer, '正在查询预审状态...');

    try {
        const response = await fetch(`/api/qianchuan/audit/${taskId}`);
        const result = await response.json();
        
        const testResult = {
            title: '千川状态查询',
            status: result.code === 0 ? 'success' : 'error',
            details: `任务ID: ${taskId}, 状态: ${result.data?.status || '未知'}`,
            result: result,
            time: new Date().toLocaleString()
        };

        addTestResult(testResult);
        showNotification('状态查询完成', 'success');

    } catch (error) {
        console.error('状态查询失败:', error);
        showNotification('状态查询失败，请重试', 'error');
        
        const errorResult = {
            title: '千川状态查询',
            status: 'error',
            details: `状态查询失败: ${error.message}`,
            time: new Date().toLocaleString()
        };
        addTestResult(errorResult);
    }
}

// 辅助函数
function showLoadingState(container, message) {
    container.innerHTML = `
        <div class="loading-spinner active">
            <div class="spinner"></div>
            <p>${message}</p>
        </div>
    `;
}

function addTestResult(result) {
    const resultsContainer = document.getElementById('resultsContainer');
    
    // 移除加载状态
    const loadingSpinner = resultsContainer.querySelector('.loading-spinner');
    if (loadingSpinner) {
        loadingSpinner.remove();
    }

    // 如果是第一个结果，清空占位文本
    if (resultsContainer.querySelector('p')) {
        resultsContainer.innerHTML = '';
    }

    const resultElement = document.createElement('div');
    resultElement.className = `result-item ${result.status}`;
    resultElement.innerHTML = `
        <div class="result-header">
            <div class="result-title">${result.title}</div>
            <div class="result-status status-${result.status}">${getStatusText(result.status)}</div>
        </div>
        <div class="result-details">${result.details}</div>
        <div class="result-time">${result.time}</div>
    `;

    resultsContainer.insertBefore(resultElement, resultsContainer.firstChild);
}

function startMockTest() {
    const resultsContainer = document.getElementById('resultsContainer');
    
    // 添加加载状态
    resultsContainer.innerHTML = `
        <div class="loading-spinner active">
            <div class="spinner"></div>
            <p>正在运行模拟测试...</p>
        </div>
    `;
    
    // 模拟测试过程
    setTimeout(() => {
        const testResults = [
            {
                title: '图片上传测试',
                status: 'success',
                details: '成功上传测试图片文件，文件大小: 2.5MB',
                time: new Date().toLocaleString()
            },
            {
                title: '视频上传测试',
                status: 'success',
                details: '成功上传测试视频文件，文件大小: 25MB，时长: 120秒',
                time: new Date().toLocaleString()
            },
            {
                title: '文案上传测试',
                status: 'success',
                details: '成功上传测试文案，字数: 500字',
                time: new Date().toLocaleString()
            }
        ];
        
        displayTestResults(testResults);
        showNotification('模拟测试完成', 'success');
    }, 2000);
}

function startViolationTest() {
    const resultsContainer = document.getElementById('resultsContainer');
    
    // 添加加载状态
    resultsContainer.innerHTML = `
        <div class="loading-spinner active">
            <div class="spinner"></div>
            <p>正在运行违规检测测试...</p>
        </div>
    `;
    
    // 模拟违规测试过程
    setTimeout(() => {
        const testResults = [
            {
                title: '违规素材检测',
                status: 'error',
                details: '检测到违规内容: 误导性宣传、不适当内容',
                time: new Date().toLocaleString()
            },
            {
                title: '版权检测',
                status: 'warning',
                details: '发现潜在的版权问题，需要人工审核',
                time: new Date().toLocaleString()
            },
            {
                title: '质量评估',
                status: 'error',
                details: '素材质量评分过低，建议优化后重新上传',
                time: new Date().toLocaleString()
            }
        ];
        
        displayTestResults(testResults);
        showNotification('违规检测测试完成', 'warning');
    }, 3000);
}

function displayTestResults(results) {
    const resultsContainer = document.getElementById('resultsContainer');
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<p style="color: #666; text-align: center;">暂无测试结果</p>';
        return;
    }
    
    resultsContainer.innerHTML = results.map(result => `
        <div class="result-item ${result.status}">
            <div class="result-header">
                <div class="result-title">${result.title}</div>
                <div class="result-status status-${result.status}">${getStatusText(result.status)}</div>
            </div>
            <div class="result-details">${result.details}</div>
            <div class="result-time">${result.time}</div>
        </div>
    `).join('');
}

function getStatusText(status) {
    const statusMap = {
        'success': '成功',
        'error': '失败',
        'warning': '警告',
        'info': '信息'
    };
    return statusMap[status] || status;
}

// 页面内容更新函数
function updatePageContent(page) {
    switch(page) {
        case 'test-upload':
            initializeTestUpload();
            break;
        case 'overview':
            updateDashboard();
            break;
        case 'materials':
            loadMaterials();
            break;
    }
}

function initializeTestUpload() {
    // 初始化测试页面
    console.log('测试页面已加载');
    
    // 清空之前的测试结果
    const resultsContainer = document.getElementById('resultsContainer');
    if (resultsContainer) {
        resultsContainer.innerHTML = '<p style="color: #666; text-align: center;">点击上方按钮开始测试</p>';
    }
}

// 预审结果页面功能
let auditResults = [];
let currentAuditPage = 1;
let auditFilters = {
    account_id: '',
    status: 'all',
    date: ''
};

// 加载预审结果
async function loadAuditResults() {
    const loading = document.getElementById('auditLoading');
    const container = document.getElementById('auditResultsContainer');
    
    if (loading) loading.classList.add('active');
    
    // 显示加载状态
    if (container && !loading) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <div class="spinner" style="margin: 0 auto 15px; border: 4px solid #f3f3f3; border-top: 4px solid #667eea; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>
                <p>正在加载预审结果...</p>
            </div>
        `;
    }
    
    try {
        // 构建查询参数
        const params = new URLSearchParams();
        if (auditFilters.account_id) params.append('account_id', auditFilters.account_id);
        if (auditFilters.status !== 'all') params.append('status', auditFilters.status);
        params.append('page', currentAuditPage);
        params.append('limit', 10);
        
        const response = await fetch(`/api/qianchuan/audit-results/list?${params}`);
        
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.code === 0) {
            auditResults = result.data.results || [];
            displayAuditResults(auditResults);
            updateAuditStats();
            updateAuditPaginationInfo(result.data);
        } else {
            console.error('API返回错误:', result.message);
            showNotification(`加载失败: ${result.message || '未知错误'}`, 'error');
            displayErrorState(container, '加载预审结果失败');
        }
    } catch (error) {
        console.error('加载预审结果失败:', error);
        showNotification('网络错误，请检查连接', 'error');
        displayErrorState(container, '网络连接失败');
    } finally {
        if (loading) loading.classList.remove('active');
    }
}

// 显示错误状态
function displayErrorState(container, message) {
    if (!container) return;
    
    container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #e74c3c;">
            <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 15px;"></i>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="loadAuditResults()" style="margin-top: 15px;">
                <i class="fas fa-refresh"></i> 重新加载
            </button>
        </div>
    `;
}

// 显示预审结果
function displayAuditResults(results) {
    const container = document.getElementById('auditResultsContainer');
    
    // 检查容器是否存在
    if (!container) {
        console.error('预审结果容器不存在');
        return;
    }
    
    if (!results || results.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-search" style="font-size: 48px; margin-bottom: 15px; color: #ccc;"></i>
                <p>暂无预审结果</p>
                <button class="btn btn-primary" onclick="loadAuditResults()" style="margin-top: 15px;">
                    <i class="fas fa-refresh"></i> 重新加载
                </button>
            </div>
        `;
        return;
    }
    
    try {
        container.innerHTML = results.map(result => {
            // 安全地处理每个结果
            const name = result.name || `素材${result.id}`;
            const taskId = result.task_id || 'N/A';
            const createdAt = result.created_at ? new Date(result.created_at).toLocaleString() : '未知时间';
            const status = result.status || 'pending';
            const auditStatus = result.audit_status || 'pending';
            const type = result.type || 'unknown';
            const spend = (result.spend || 0).toLocaleString();
            const ctr = (result.ctr || 0).toFixed(2);
            const violations = result.violations || [];
            
            return `
                <div class="audit-result-item">
                    <div class="audit-result-header">
                        <div class="audit-result-info">
                            <div class="audit-result-title">${name}</div>
                            <div class="audit-result-meta">
                                素材ID: ${result.id} | 任务ID: ${taskId} | 
                                创建时间: ${createdAt}
                            </div>
                        </div>
                        <div class="audit-result-status">
                            <span class="audit-status-badge status-${status}">
                                ${getAuditStatusLabel(status)}
                            </span>
                        </div>
                    </div>
                    
                    <div class="audit-result-details">
                        <div class="detail-item">
                            <span class="detail-label">素材类型</span>
                            <span class="detail-value">${getMaterialTypeLabel(type)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">审核状态</span>
                            <span class="detail-value">${getAuditStatusLabel(auditStatus)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">消耗金额</span>
                            <span class="detail-value">¥${spend}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">点击率</span>
                            <span class="detail-value">${ctr}%</span>
                        </div>
                    </div>
                    
                    ${violations.length > 0 ? `
                        <div class="violations-list">
                            <h4>违规内容</h4>
                            <ul>
                                ${violations.map(v => `<li>${getViolationLabel(v)}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    <div class="audit-result-actions">
                        <button class="btn btn-primary" onclick="viewAuditDetail(${result.id})">
                            <i class="fas fa-eye"></i> 查看详情
                        </button>
                        <button class="btn btn-secondary" onclick="exportAuditResult(${result.id})">
                            <i class="fas fa-download"></i> 导出结果
                        </button>
                        ${status === 'pending' ? `
                            <button class="btn btn-info" onclick="checkAuditStatus(${result.id})">
                                <i class="fas fa-sync-alt"></i> 刷新状态
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('显示预审结果时出错:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #e74c3c;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 15px;"></i>
                <p>显示预审结果时出错</p>
                <button class="btn btn-primary" onclick="loadAuditResults()" style="margin-top: 15px;">
                    <i class="fas fa-refresh"></i> 重新加载
                </button>
            </div>
        `;
    }
}

// 更新预审统计数据
async function updateAuditStats() {
    try {
        const response = await fetch('/api/qianchuan/audit-stats');
        const result = await response.json();
        
        if (result.code === 0) {
            const stats = result.data;
            
            // 更新统计数据，添加错误处理
            const totalElement = document.getElementById('totalMaterials');
            const approvedElement = document.getElementById('approvedCount');
            const rejectedElement = document.getElementById('rejectedCount');
            const pendingElement = document.getElementById('pendingCount');
            const rateElement = document.getElementById('approvalRate');
            
            if (totalElement) totalElement.textContent = stats.total || 0;
            if (approvedElement) approvedElement.textContent = stats.approved || 0;
            if (rejectedElement) rejectedElement.textContent = stats.rejected || 0;
            if (pendingElement) pendingElement.textContent = stats.pending || 0;
            if (rateElement) rateElement.textContent = `${stats.approval_rate || 0}%`;
        }
    } catch (error) {
        console.error('更新统计数据失败:', error);
        // 如果API失败，使用默认值
        const totalElement = document.getElementById('totalMaterials');
        const approvedElement = document.getElementById('approvedCount');
        const rejectedElement = document.getElementById('rejectedCount');
        const pendingElement = document.getElementById('pendingCount');
        const rateElement = document.getElementById('approvalRate');
        
        if (totalElement) totalElement.textContent = '0';
        if (approvedElement) approvedElement.textContent = '0';
        if (rejectedElement) rejectedElement.textContent = '0';
        if (pendingElement) pendingElement.textContent = '0';
        if (rateElement) rateElement.textContent = '0%';
    }
}

// 筛选预审结果
function filterAuditResults() {
    auditFilters.account_id = document.getElementById('accountIdFilter').value;
    auditFilters.status = document.getElementById('statusFilter').value;
    auditFilters.date = document.getElementById('dateFilter').value;
    currentAuditPage = 1;
    
    loadAuditResults();
}

// 更新分页信息
function updateAuditPaginationInfo(data) {
    const pageInfo = document.getElementById('pageInfo');
    const totalPages = Math.ceil(data.total / data.limit);
    
    if (pageInfo) {
        pageInfo.textContent = `第 ${data.page} 页，共 ${totalPages} 页`;
    }
}

// 分页控制
function previousPage() {
    if (currentAuditPage > 1) {
        currentAuditPage--;
        loadAuditResults();
    }
}

function nextPage() {
    currentAuditPage++;
    loadAuditResults();
}

// 查看预审详情
async function viewAuditDetail(id) {
    try {
        const accountId = document.getElementById('accountIdFilter').value || '123456789';
        const response = await fetch(`/api/qianchuan/audit-results?account_id=${accountId}&object_id=${id}`);
        const result = await response.json();
        
        if (result.code === 0) {
            const detail = result.data;
            showAuditDetailModal(detail);
        } else {
            showNotification('获取详情失败', 'error');
        }
    } catch (error) {
        console.error('获取预审详情失败:', error);
        showNotification('获取详情失败', 'error');
    }
}

// 显示预审详情弹窗
function showAuditDetailModal(detail) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>预审结果详情</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="detail-section">
                    <h4>基本信息</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">素材名称</span>
                            <span class="detail-value">${detail.material_name}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">素材ID</span>
                            <span class="detail-value">${detail.object_id}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">素材类型</span>
                            <span class="detail-value">${getMaterialTypeLabel(detail.material_type)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">审核状态</span>
                            <span class="detail-value">
                                <span class="audit-status-badge status-${detail.status.toLowerCase()}">
                                    ${getAuditStatusLabel(detail.status)}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>审核信息</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">审核时间</span>
                            <span class="detail-value">${new Date(detail.audit_time).toLocaleString()}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">质量评分</span>
                            <span class="detail-value">
                                <div class="score-display">
                                    <div class="score-bar">
                                        <div class="score-fill ${getScoreClass(detail.score || 0)}" 
                                             style="width: ${detail.score || 0}%"></div>
                                    </div>
                                    <span>${detail.score || 0}分</span>
                                </div>
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>审核结果</h4>
                    <div class="result-reason">
                        <p>${detail.reason_text}</p>
                    </div>
                </div>
                
                ${detail.violations && detail.violations.length > 0 ? `
                    <div class="detail-section">
                        <h4>违规内容</h4>
                        <div class="violations-list">
                            <ul>
                                ${detail.violations.map(v => `<li>${getViolationLabel(v)}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                ` : ''}
                
                ${detail.suggestions && detail.suggestions.length > 0 ? `
                    <div class="detail-section">
                        <h4>优化建议</h4>
                        <div class="suggestions-list">
                            <ul>
                                ${detail.suggestions.map(s => `<li>${s}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                ` : ''}
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">关闭</button>
                <button class="btn btn-primary" onclick="exportAuditDetail(${detail.object_id})">导出详情</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 点击背景关闭
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// 导出预审结果
function exportAuditResults() {
    if (auditResults.length === 0) {
        showNotification('没有可导出的数据', 'warning');
        return;
    }
    
    const csv = convertToCSV(auditResults);
    downloadCSV(csv, 'audit_results.csv');
    showNotification('预审结果已导出', 'success');
}

// 导出单个预审结果
function exportAuditResult(id) {
    const result = auditResults.find(r => r.id === id);
    if (result) {
        const csv = convertToCSV([result]);
        downloadCSV(csv, `audit_result_${id}.csv`);
        showNotification('预审结果已导出', 'success');
    }
}

// 导出预审详情
function exportAuditDetail(id) {
    // 这里可以实现更详细的导出逻辑
    showNotification('详情导出功能开发中', 'info');
}

// 检查审核状态
async function checkAuditStatus(id) {
    try {
        const material = materials.find(m => m.id == id);
        if (material && material.qianchuan_task_id) {
            const response = await fetch(`/api/qianchuan/audit/${material.qianchuan_task_id}`);
            const result = await response.json();
            
            if (result.code === 0) {
                showNotification(`审核状态: ${result.data.status}`, 'info');
                // 刷新结果列表
                loadAuditResults();
            }
        }
    } catch (error) {
        console.error('检查审核状态失败:', error);
        showNotification('检查状态失败', 'error');
    }
}

// 辅助函数
function getAuditStatusLabel(status) {
    const labels = {
        'passed': '已通过',
        'failed': '已拒绝',
        'pending': '审核中',
        'APPROVE': '通过',
        'REJECT': '拒绝',
        'AUDITING': '审核中'
    };
    return labels[status] || status;
}

function getMaterialTypeLabel(type) {
    const labels = {
        'image': '图片',
        'video': '视频',
        'text': '文案'
    };
    return labels[type] || type;
}

function getViolationLabel(violation) {
    const labels = {
        'content_violation': '内容违规',
        'policy_breach': '违反政策',
        'copyright_issue': '版权问题',
        'misleading_claim': '误导性宣传',
        'inappropriate_content': '不适当内容',
        'false_information': '虚假信息'
    };
    return labels[violation] || violation;
}

function getScoreClass(score) {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
}

function convertToCSV(data) {
    const headers = ['ID', '名称', '类型', '状态', '审核状态', '创建时间', '消耗', '点击率'];
    const rows = data.map(item => [
        item.id,
        item.name,
        getMaterialTypeLabel(item.type),
        getAuditStatusLabel(item.status),
        getAuditStatusLabel(item.audit_status),
        new Date(item.created_at).toLocaleString(),
        item.spend,
        item.ctr
    ]);
    
    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
    
    return '\ufeff' + csvContent; // 添加BOM以支持中文
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}

// 添加模态框样式
const modalStyles = `
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.3s ease;
}

.modal-content {
    background: white;
    border-radius: 12px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    animation: slideUp 0.3s ease;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
    margin: 0;
    color: #2c3e50;
}

.modal-close {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #666;
    padding: 5px;
    border-radius: 4px;
    transition: background 0.3s;
}

.modal-close:hover {
    background: #f0f0f0;
}

.modal-body {
    padding: 20px;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 20px;
    border-top: 1px solid #e0e0e0;
}

.detail-section {
    margin-bottom: 25px;
}

.detail-section h4 {
    margin: 0 0 15px 0;
    color: #2c3e50;
    font-size: 16px;
}

.detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
}

.result-reason {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    border-left: 4px solid #667eea;
}

.audit-status-badge {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
}

.status-passed, .status-approve {
    background: #d4edda;
    color: #155724;
}

.status-failed, .status-reject {
    background: #f8d7da;
    color: #721c24;
}

.status-pending, .status-auditing {
    background: #fff3cd;
    color: #856404;
}

@keyframes slideUp {
    from { transform: translateY(30px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

@media (max-width: 768px) {
    .modal-content {
        width: 95%;
        max-height: 90vh;
    }
    
    .detail-grid {
        grid-template-columns: 1fr;
    }
    
    .modal-footer {
        flex-direction: column;
    }
}
`;

// 添加模态框样式到页面
const modalStyleSheet = document.createElement('style');
modalStyleSheet.textContent = modalStyles;
document.head.appendChild(modalStyleSheet);

// 页面切换时初始化预审结果页面
document.addEventListener('DOMContentLoaded', function() {
    // 监听页面切换
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetPage = this.getAttribute('data-page');
            if (targetPage === 'review') {
                setTimeout(() => {
                    loadAuditResults();
                }, 100);
            }
        });
    });
});

// 添加样式到页面
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);