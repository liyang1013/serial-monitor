<template>
  <div id="app">
    <div class="container">
      <h1>串口数据监控系统</h1>

      <!-- 控制面板 -->
      <div class="control-panel">
        <el-card class="control-card">
          <template #header>
            <div class="card-header">
              <span>串口控制</span>
              <el-button type="primary" @click="getAvailableSerialPort" :icon="Refresh">
                刷新串口列表
              </el-button>
            </div>
          </template>

          <div class="port-list">
            <div v-for="port in serialPortList" :key="port.path" class="port-item">
              <div class="port-info">
                <span class="port-name">{{ port.name }}</span>
              </div>
              <div class="port-actions">
                <el-button  type="success" size="small" >
                  打开
                </el-button>
                <el-button  type="danger" size="small" >
                  关闭
                </el-button>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="settings-card">
          <template #header>
            <div class="card-header">
              <span>串口设置</span>
            </div>
          </template>

          <el-form :model="portSettings" label-width="80px">
            <el-form-item label="波特率">
              <el-select v-model="portSettings.baudRate">
                <el-option label="9600" :value="9600" />
                <el-option label="115200" :value="115200" />
                <el-option label="57600" :value="57600" />
                <el-option label="38400" :value="38400" />
              </el-select>
            </el-form-item>

            <el-form-item label="数据位">
              <el-select v-model="portSettings.dataBits">
                <el-option label="8" :value="8" />
                <el-option label="7" :value="7" />
              </el-select>
            </el-form-item>

            <el-form-item label="停止位">
              <el-select v-model="portSettings.stopBits">
                <el-option label="1" :value="1" />
                <el-option label="2" :value="2" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-card>
      </div>

      <!-- 数据展示区域 -->
      <!-- <el-card class="data-card">
        <template #header>
          <div class="card-header">
            <span>串口数据 (WebSocket: {{ wsStatus }})</span>
            <div>
              <el-button type="warning" @click="clearData">
                清空数据
              </el-button>
              <el-button :type="wsConnected ? 'success' : 'danger'" @click="toggleWebSocket">
                {{ wsConnected ? '断开' : '连接' }} WebSocket
              </el-button>
            </div>
          </div>
        </template>

        <div class="data-display">
          <div v-for="item in serialData" :key="item.timestamp" class="data-item">
            <span class="data-time">{{ formatTime(item.timestamp) }}</span>
            <span class="data-port">[{{ item.portName }}]</span>
            <span class="data-content">{{ item.data }}</span>
          </div>
        </div>
      </el-card> -->

      <!-- API 信息 -->
      <!-- <el-card class="api-card">
        <template #header>
          <div class="card-header">
            <span>API 接口信息</span>
          </div>
        </template>

        <div class="api-info">
          <p><strong>WebSocket 服务器:</strong> ws://localhost:8081/serial</p>
          <p><strong>HTTP API 地址:</strong> http://localhost:8081/api</p>
          <p><strong>可用接口:</strong></p>
          <ul>
            <li>GET /api/ports - 获取串口列表</li>
            <li>GET /api/health - 健康检查</li>
            <li>WebSocket /serial - 实时串口数据</li>
          </ul>
        </div>
      </el-card> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

interface serialPort {
  name: string,
  path: string
}

let selectedPort: serialPort = ref(null)
let serialPortList = reactive(Array<serialPort> || [])
let portSettings = reactive({ baudRate: 9600, dataBits: 8, stopBits: 1 })

const getAvailableSerialPort = async () => {
  serialPortList = await window.electron.ipcRenderer.invoke('getAvailableSerialPort')
  console.log(serialPortList)
}

onMounted(() => {
  getAvailableSerialPort()
})

</script>
<style scoped>
.container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.control-panel {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.port-list {
  max-height: 300px;
  overflow-y: auto;
}

.port-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.port-info {
  display: flex;
  flex-direction: column;
}

.port-name {
  font-weight: bold;
}

.port-details {
  font-size: 12px;
  color: #666;
}

.data-display {
  max-height: 400px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
}

.data-item {
  padding: 5px 0;
  border-bottom: 1px solid #e9ecef;
}

.data-time {
  color: #6c757d;
  margin-right: 10px;
  font-size: 12px;
}

.data-port {
  color: #007bff;
  margin-right: 10px;
  font-weight: bold;
}

.data-content {
  color: #212529;
}

.api-info {
  font-size: 14px;
}

.api-info ul {
  margin: 10px 0;
  padding-left: 20px;
}

.api-info li {
  margin: 5px 0;
  font-family: 'Courier New', monospace;
}
</style>