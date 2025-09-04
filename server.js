const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

let materials = [
  {
    id: 1,
    name: 'Summer Sale Banner',
    type: 'image',
    status: 'approved',
    compliance: 'passed',
    prediction: 'high_quality',
    violations: [],
    spend: 1250,
    ctr: 3.2,
    uploader: '张三',
    client: '客户A',
    createdAt: '2024-06-15'
  },
  {
    id: 2,
    name: 'Product Demo Video',
    type: 'video',
    status: 'testing',
    compliance: 'pending',
    prediction: 'medium_quality',
    violations: [],
    spend: 890,
    ctr: 2.1,
    uploader: '李四',
    client: '千川客户',
    createdAt: '2024-06-18',
    qianchuan_task_id: 'qc_task_001'
  },
  {
    id: 3,
    name: 'Holiday Campaign Copy',
    type: 'text',
    status: 'flagged',
    compliance: 'failed',
    prediction: 'low_quality',
    violations: ['misleading_claim', 'inappropriate_content'],
    spend: 450,
    ctr: 0.8,
    uploader: '王五',
    client: '客户C',
    createdAt: '2024-06-20'
  },
  {
    id: 4,
    name: 'New Product Launch',
    type: 'image',
    status: 'approved',
    compliance: 'passed',
    prediction: 'high_quality',
    violations: [],
    spend: 2100,
    ctr: 4.5,
    uploader: '赵六',
    client: '客户A',
    createdAt: '2024-06-22'
  },
  {
    id: 5,
    name: 'Weekend Special Offer',
    type: 'video',
    status: 'pending',
    compliance: 'pending',
    prediction: 'pending',
    violations: [],
    spend: 0,
    ctr: 0,
    uploader: '张三',
    client: '客户D',
    createdAt: '2024-06-25'
  },
  {
    id: 6,
    name: 'Back to School Campaign',
    type: 'text',
    status: 'approved',
    compliance: 'passed',
    prediction: 'medium_quality',
    violations: [],
    spend: 680,
    ctr: 2.8,
    uploader: '李四',
    client: '客户B',
    createdAt: '2024-06-28'
  },
  {
    id: 7,
    name: 'Flash Sale Banner',
    type: 'image',
    status: 'flagged',
    compliance: 'failed',
    prediction: 'low_quality',
    violations: ['copyright_issue'],
    spend: 320,
    ctr: 1.2,
    uploader: '王五',
    client: '客户E',
    createdAt: '2024-06-30'
  },
  {
    id: 8,
    name: 'Customer Testimonial',
    type: 'video',
    status: 'approved',
    compliance: 'passed',
    prediction: 'high_quality',
    violations: [],
    spend: 1850,
    ctr: 5.1,
    uploader: '赵六',
    client: '客户A',
    createdAt: '2024-07-02'
  },
  {
    id: 9,
    name: 'Limited Time Offer',
    type: 'text',
    status: 'rejected',
    compliance: 'failed',
    prediction: 'low_quality',
    violations: ['false_information', 'misleading_claim'],
    spend: 150,
    ctr: 0.5,
    uploader: '张三',
    client: '客户F',
    createdAt: '2024-07-05'
  },
  {
    id: 10,
    name: 'Product Comparison',
    type: 'image',
    status: 'testing',
    compliance: 'pending',
    prediction: 'medium_quality',
    violations: [],
    spend: 420,
    ctr: 2.3,
    uploader: '李四',
    client: '客户G',
    createdAt: '2024-07-08'
  },
  {
    id: 11,
    name: '千川短视频广告',
    type: 'video',
    status: 'pending',
    compliance: 'pending',
    prediction: 'pending',
    violations: [],
    spend: 0,
    ctr: 0,
    uploader: '王五',
    client: '千川客户',
    createdAt: '2024-09-01',
    qianchuan_task_id: 'qc_task_002'
  },
  {
    id: 12,
    name: '千川直播预告',
    type: 'video',
    status: 'approved',
    compliance: 'passed',
    prediction: 'high_quality',
    violations: [],
    spend: 3200,
    ctr: 5.8,
    uploader: '赵六',
    client: '千川客户',
    createdAt: '2024-09-02',
    qianchuan_task_id: 'qc_task_003'
  }
];

app.get('/api/materials', (req, res) => {
  res.json(materials);
});

app.post('/api/materials/upload', upload.single('file'), (req, res) => {
  const newMaterial = {
    id: materials.length + 1,
    name: req.body.name || req.file.originalname,
    type: req.body.type || 'unknown',
    status: 'pending',
    compliance: 'pending',
    prediction: 'pending',
    violations: [],
    spend: 0,
    ctr: 0,
    uploader: '管理员',
    client: '系统',
    createdAt: new Date().toISOString().split('T')[0]
  };
  materials.push(newMaterial);
  res.json(newMaterial);
});

app.put('/api/materials/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, compliance, prediction } = req.body;
  const material = materials.find(m => m.id == id);
  if (material) {
    material.status = status || material.status;
    material.compliance = compliance || material.compliance;
    material.prediction = prediction || material.prediction;
    res.json(material);
  } else {
    res.status(404).json({ error: 'Material not found' });
  }
});

app.delete('/api/materials/:id', (req, res) => {
  const { id } = req.params;
  materials = materials.filter(m => m.id != id);
  res.json({ message: 'Material deleted' });
});

// 千川预审接口
app.post('/api/qianchuan/audit', async (req, res) => {
  try {
    const { account_id, video_id, access_token, msg_type = 'SEND' } = req.body;
    
    if (!account_id || !video_id || !access_token) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        required: ['account_id', 'video_id', 'access_token']
      });
    }

    const auditData = {
      account_id: parseInt(account_id),
      business_type: 'QIAN_CHUAN',
      type: 'VIDEO',
      data: video_id,
      msg_type: msg_type
    };

    console.log('Sending audit request:', auditData);

    // 模拟API调用（实际环境中需要真实的千川API调用）
    const mockResponse = {
      code: 0,
      message: 'OK',
      data: {
        result: true,
        task_id: Date.now(),
        object_id: parseInt(video_id),
        request_id: `req_${Date.now()}`
      }
    };

    // 实际API调用代码（需要真实的access_token）
    /*
    const response = await axios.post(
      'https://api.oceanengine.com/open_api/v3.0/security/open_material_audit/',
      auditData,
      {
        headers: {
          'Access-Token': access_token,
          'Content-Type': 'application/json'
        }
      }
    );
    */

    // 记录预审请求
    const auditLog = {
      id: Date.now(),
      account_id,
      video_id,
      msg_type,
      task_id: mockResponse.data.task_id,
      status: 'pending',
      created_at: new Date().toISOString(),
      response: mockResponse
    };

    // 模拟预审结果更新
    setTimeout(() => {
      const material = materials.find(m => m.id == video_id);
      if (material) {
        material.compliance = Math.random() > 0.3 ? 'passed' : 'failed';
        material.status = material.compliance === 'passed' ? 'approved' : 'flagged';
        
        if (material.compliance === 'failed') {
          material.violations = ['content_violation', 'policy_breach'];
        }
        
        console.log(`Audit result updated for material ${video_id}:`, material);
      }
    }, 5000);

    res.json(mockResponse);

  } catch (error) {
    console.error('Qianchuan audit error:', error);
    res.status(500).json({ 
      error: 'Audit request failed',
      message: error.message 
    });
  }
});

// 获取预审状态
app.get('/api/qianchuan/audit/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    // 模拟状态查询
    const mockStatus = {
      code: 0,
      message: 'OK',
      data: {
        task_id: parseInt(taskId),
        status: 'COMPLETED',
        result: Math.random() > 0.3 ? 'APPROVED' : 'REJECTED',
        reason: Math.random() > 0.3 ? null : '内容违反广告政策',
        audit_time: new Date().toISOString()
      }
    };

    res.json(mockStatus);

  } catch (error) {
    console.error('Audit status error:', error);
    res.status(500).json({ 
      error: 'Status check failed',
      message: error.message 
    });
  }
});

// 千川素材管理相关接口
app.get('/api/qianchuan/materials', (req, res) => {
  const qianchuanMaterials = materials.filter(m => 
    m.type === 'video' && m.client === '千川客户'
  );
  res.json(qianchuanMaterials);
});

// 批量预审接口
app.post('/api/qianchuan/batch-audit', async (req, res) => {
  try {
    const { account_id, video_ids, access_token } = req.body;
    
    if (!account_id || !video_ids || !access_token) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        required: ['account_id', 'video_ids', 'access_token']
      });
    }

    const results = [];
    
    for (const video_id of video_ids) {
      const auditData = {
        account_id: parseInt(account_id),
        business_type: 'QIAN_CHUAN',
        type: 'VIDEO',
        data: video_id,
        msg_type: 'SEND'
      };

      // 模拟批量预审
      const mockResponse = {
        video_id,
        task_id: Date.now() + Math.random(),
        status: 'pending',
        result: 'PROCESSING'
      };

      results.push(mockResponse);

      // 模拟预审结果更新
      setTimeout(() => {
        const material = materials.find(m => m.id == video_id);
        if (material) {
          material.compliance = Math.random() > 0.3 ? 'passed' : 'failed';
          material.status = material.compliance === 'passed' ? 'approved' : 'flagged';
          
          if (material.compliance === 'failed') {
            material.violations = ['content_violation', 'policy_breach'];
          }
        }
      }, 3000 + Math.random() * 2000);
    }

    res.json({
      code: 0,
      message: 'Batch audit initiated',
      data: {
        total_count: video_ids.length,
        results: results
      }
    });

  } catch (error) {
    console.error('Batch audit error:', error);
    res.status(500).json({ 
      error: 'Batch audit failed',
      message: error.message 
    });
  }
});

// 千川预审结果查询接口 - 按照MD文件规范
app.get('/api/qianchuan/audit-results', async (req, res) => {
  try {
    const { account_id, object_id } = req.query;
    
    if (!account_id || !object_id) {
      return res.status(400).json({ 
        code: 400,
        message: 'Missing required parameters: account_id, object_id'
      });
    }

    // 查找对应的素材
    const material = materials.find(m => m.id == object_id);
    
    // 模拟预审结果数据，严格按照MD文件格式
    let mockData = {};
    
    if (material) {
      // 根据素材状态确定审核结果
      if (material.compliance === 'passed') {
        mockData = {
          status: 'APPROVE',
          reason_text: '素材审核通过，符合广告投放标准',
          request_id: `req_${Date.now()}_${object_id}`
        };
      } else if (material.compliance === 'failed') {
        mockData = {
          status: 'REJECT',
          reason_text: '素材包含违规内容，不符合广告投放标准',
          request_id: `req_${Date.now()}_${object_id}`
        };
      } else {
        mockData = {
          status: 'AUDITING',
          reason_text: '素材正在审核中，请耐心等待',
          request_id: `req_${Date.now()}_${object_id}`
        };
      }
    } else {
      // 如果素材不存在，返回审核中状态
      mockData = {
        status: 'AUDITING',
        reason_text: '素材正在审核中，请耐心等待',
        request_id: `req_${Date.now()}_${object_id}`
      };
    }

    // 按照MD文件格式返回
    res.json({
      code: 0,
      message: 'OK',
      data: mockData
    });

  } catch (error) {
    console.error('Audit results query error:', error);
    res.status(500).json({ 
      code: 500,
      message: 'Audit results query failed'
    });
  }
});

// 获取所有预审结果列表
app.get('/api/qianchuan/audit-results/list', (req, res) => {
  try {
    const { account_id, status, page = 1, limit = 20 } = req.query;
    
    // 过滤千川素材
    let qianchuanMaterials = materials.filter(m => 
      m.client === '千川客户' && m.type === 'video'
    );
    
    if (account_id) {
      qianchuanMaterials = qianchuanMaterials.filter(m => 
        m.advertiser_id == account_id
      );
    }
    
    if (status && status !== 'all') {
      qianchuanMaterials = qianchuanMaterials.filter(m => 
        m.compliance === status
      );
    }

    // 分页处理
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedResults = qianchuanMaterials.slice(startIndex, endIndex);

    const results = paginatedResults.map(material => ({
      id: material.id,
      name: material.name,
      type: material.type,
      status: material.compliance || 'pending',
      audit_status: material.status || 'pending',
      task_id: material.qianchuan_task_id,
      created_at: material.createdAt,
      violations: material.violations || [],
      spend: material.spend || 0,
      ctr: material.ctr || 0
    }));

    res.json({
      code: 0,
      message: 'OK',
      data: {
        total: qianchuanMaterials.length,
        page: parseInt(page),
        limit: parseInt(limit),
        results: results
      }
    });

  } catch (error) {
    console.error('Audit results list error:', error);
    res.status(500).json({ 
      error: 'Audit results list failed',
      message: error.message 
    });
  }
});

// 获取预审统计信息
app.get('/api/qianchuan/audit-stats', (req, res) => {
  try {
    const qianchuanMaterials = materials.filter(m => 
      m.client === '千川客户' && m.type === 'video'
    );

    const stats = {
      total: qianchuanMaterials.length,
      approved: qianchuanMaterials.filter(m => m.compliance === 'passed').length,
      rejected: qianchuanMaterials.filter(m => m.compliance === 'failed').length,
      pending: qianchuanMaterials.filter(m => m.compliance === 'pending').length,
      total_spend: qianchuanMaterials.reduce((sum, m) => sum + (m.spend || 0), 0),
      avg_ctr: qianchuanMaterials.reduce((sum, m) => sum + (m.ctr || 0), 0) / qianchuanMaterials.length || 0,
      approval_rate: qianchuanMaterials.length > 0 ? 
        (qianchuanMaterials.filter(m => m.compliance === 'passed').length / qianchuanMaterials.length * 100).toFixed(1) : 0
    };

    res.json({
      code: 0,
      message: 'OK',
      data: stats
    });

  } catch (error) {
    console.error('Audit stats error:', error);
    res.status(500).json({ 
      error: 'Audit stats failed',
      message: error.message 
    });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
