# 绝不认错 ——— AI 对线小游戏

## 地址
http://111.228.60.241:8080/

## 配置文件
- **主函数：** /backend/main.py
- **前端界面：** /src/components
- **API KEY 配置：** /src/components/Landing.jsx 中的两个 "YOUR API KEY"
- **如果想在 localhost 上运行需要将：**
    - src/App.jsx
    - src/components/ChatRoom.jsx
    - src/components/AdminDashboard.jsx
    
  三个文件中的``/api/...``全部替换成``http://localhost:8000/api/...``。
  
  项目默认运行咋本地 8000 端口上

  配置完成之后 ``npm run dev``，另一个终端``python3 backend/main.py``即可启动

## 玩法
  - **模式 1：** AI VS AI
  - **模式 2：** 人 VS AI
  - 游戏中所有剧本，角色均由 **AI 随机生成**

## AI
游戏中默认配置了 **deepseek** 与 **Gemini** 两个 AI，如有需要可以通过 **custom** 更改

