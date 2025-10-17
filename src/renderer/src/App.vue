<template>
  <div class="container">
    <header>
      <h1>串口数据监控器</h1>
      <div class="subtitle">监控串口数据并通过 WebSocket 对外提供数据接口</div>
    </header>

    <div class="card">
      <h2>串口控制</h2>
      <div class="control-panel">
        <el-select v-model="selectedPort" placeholder="选择串口" style="width: 200px" :disabled="isConnect">
          <el-option v-for="port in serialPortList" :key="port.path" :label="port.name" :value="port.path" />
        </el-select>
        <el-button type="primary" :disabled="!selectedPort || isConnect" @click="connectPort">
          连接串口
        </el-button>
        <el-button type="danger" :disabled="!selectedPort || !isConnect" @click="disconnectSerialPort">
          断开串口
        </el-button>
        <el-button @click="getAvailableSerialPort" :loading="refreshPort">
          刷新串口列表
        </el-button>
      </div>
    </div>

    <div class="card">
      <h2>串口数据</h2>
      <div class="data-display" id="data-display">
        <div v-if="serialDataList.length === 0" class="empty-state">
          暂无数据
        </div>
        <div v-else>
          <div v-for="(item, index) in serialDataList" :key="index" class="data-item">
            <div>
              <span class="data-port">{{ item.port }}:</span>
              <span class="data-time">{{ item.data }}</span>
            </div>
            <div class="data-content">{{ item.timestamp }}</div>
          </div>
        </div>
      </div>
      <div class="status-bar">
        <div>已接收数据条数: <span id="data-count">{{ serialDataList.length }}</span></div>
        <el-button @click="clearserialData">清空数据</el-button>
      </div>
    </div>
    <div class="card">
      <h2>WebSocket 接口</h2>
      <p>其他应用可以通过 WebSocket 连接获取串口数据：</p>
      <div class="ws-info">
        <strong>WebSocket 服务器地址:</strong> ws://localhost:8080<br>
        <!-- <strong>当前客户端连接数:</strong> <span id="ws-client-count">{{ wsClientCount }}</span> -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { createApp, ref, onMounted, computed, onUnmounted } from 'vue'
import { serialPort, serialData } from './types'
import { ElMessage } from 'element-plus'

const refreshPort = ref<boolean>(false)
const wsClientCount = ref<number>(0)
const selectedPort = ref<string>()
const isConnect = ref(false)
const serialPortList = ref<serialPort[]>([])
const serialDataList = ref<serialData[]>([])

/**
 * 得到串口列表
 */
const getAvailableSerialPort = async () => {
  refreshPort.value = true
  serialPortList.value = await window.electron.ipcRenderer.invoke('getAvailableSerialPort')
  refreshPort.value = false
}

/**
 * 连接串口
 */
const connectPort = async () => {
  window.electron.ipcRenderer.invoke('connectPort', selectedPort.value).then(res => {
    isConnect.value = true
    ElMessage.success(`串口${selectedPort.value}连接成功`)
  }).catch(err => {
    ElMessage.error(err.message)
  }
  )
}

/**
 * 释放串口
 */
const disconnectSerialPort = async () => {
  if (selectedPort.value && isConnect.value) {
    window.electron.ipcRenderer.invoke('disconnectPort', selectedPort.value).then(res => {
      if (res.success) {
        isConnect.value = false
        clearserialData()
        ElMessage.success(`串口${selectedPort.value}释放成功`)
      }
      else ElMessage.error(res.message)
    })
  }
}

const clearserialData = () => {
  serialDataList.value.splice(0)
  ElMessage.info('信息已清空')
}

const handleSerialData = (event, data) => {
  serialDataList.value.push(data)
  if (serialDataList.value.length > 100) {
    serialDataList.value = serialDataList.value.slice(-50)
  }
}

const handleSerialError = (event, data) => {
  const { port, message } = data
  ElMessage.error(`串口 ${port} 错误: ${message}`)
}

onMounted(() => {
  getAvailableSerialPort()
  window.electron.ipcRenderer.on('serial-data', handleSerialData)
  window.electron.ipcRenderer.on('serial-error', handleSerialError)
})

onUnmounted(() => {
  // 清理监听器
  window.electron.ipcRenderer.removeAllListeners('serial-data')
  window.electron.ipcRenderer.removeAllListeners('serial-error')

  // 断开串口连接
  if (selectedPort.value) {
    disconnectSerialPort()
  }
})

</script>
<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f5f5f5;
  color: #333;
  line-height: 1.6;
}

.container {
  max-width: 95vw;
  margin: 0 auto;
  padding: 20px;
}

header {
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  color: white;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

h1 {
  font-size: 28px;
  margin-bottom: 10px;
}

.subtitle {
  font-size: 16px;
  opacity: 0.9;
}

.card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.card h2 {
  margin-bottom: 15px;
  color: #2575fc;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.control-panel {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  margin-bottom: 15px;
}

.ports-status {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
}

.port-tag {
  background-color: #e3f2fd;
  color: #1565c0;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.port-tag.connected {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.data-display {
  height: 400px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 5px;
  padding: 15px;
  font-family: 'Courier New', monospace;
  background-color: #fafafa;
}

.data-item {
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #eee;
}

.data-port {
  font-weight: bold;
  color: #2575fc;
}

.data-time {
  margin-top: 5px;
  word-break: break-all;

}

.data-content {
  color: #888;
  font-size: 12px;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #eee;
  font-size: 14px;
  color: #666;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 40px 0;
}

.ws-info {
  background-color: #fff3cd;
  border-left: 4px solid #ffc107;
  padding: 10px 15px;
  margin-top: 10px;
  border-radius: 0 5px 5px 0;
}
</style>