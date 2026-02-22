from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict
from openai import AsyncOpenAI
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= 数据统计中枢 =================
analytics_data = {
    "total_games_started": 0,
    "api_calls": {"deepseek": 0, "gemini": 0, "custom": 0},
}


def record_api_call(model_name: str):
    name = model_name.lower()
    if "deepseek" in name:
        analytics_data["api_calls"]["deepseek"] += 1
    elif "gemini" in name:
        analytics_data["api_calls"]["gemini"] += 1
    else:
        analytics_data["api_calls"]["custom"] += 1


@app.get("/api/admin/stats")
async def get_admin_stats():
    return analytics_data


# ================================================


class ApiConfig(BaseModel):
    api_key: str
    base_url: str
    model_name: str
    temp_persona: float
    temp_judge: float
    temp_partner: float


class ChatRequest(BaseModel):
    config: ApiConfig
    persona: dict
    history: List[Dict[str, str]]
    extra_prompt: str = ""


class PersonaRequest(BaseModel):
    config: ApiConfig


@app.post("/api/persona")
async def generate_persona(req: PersonaRequest):
    # 记录流量
    analytics_data["total_games_started"] += 1
    record_api_call(req.config.model_name)

    client = AsyncOpenAI(api_key=req.config.api_key, base_url=req.config.base_url)

    SYSTEM_PROMPT = """
{A}。在现场目睹你（{B}） 搞砸了一件极其重要的事情：{C}

用 JSON 把你编造的 A，B，C 输出出来。

**A, B, C 尽量简短，有冲突，不普通**

**可以不是人类，但要符合基本物理，不能太离谱**

**A 和 B 之间必须有非常搞人的，不普通的，幽默的冲突**

**禁止亲人对立内容，男女对立，禁止色情内容**

**必须能组成句子**
- 你现在的身份是{B}。你刚刚在{A}面前，{C}了

EXAMPLE OUTPUT(JSON)：
{
    "A": "深夜看病的急诊病人",
    "B": "睡迷糊的值班护士",
    "C": "把碘酒当糖水喂给病人喝了"
}

{
    "A": "网吧里通宵打团的游戏大神",
    "B": "刚当网管三天的新手",
    "C": "为了省电把插线板全拔了，说是国家号召节能减排"
}

{
    "A": "婚礼上准备发言的新郎",
    "B": "负责播放背景音乐的音控师",
    "C": "把《婚礼进行曲》错放成了《分手快乐》"
}

{
    "A": "准备了三个月的魔术师",
    "B": "临时顶替的舞台助理",
    "C": "把魔术师要变出来的鸽子提前烤了当夜宵"
}
    """
    response = await client.chat.completions.create(
        model=req.config.model_name,
        temperature=req.config.temp_persona,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": "直接生成**一个**"},
        ],
    )
    return json.loads(response.choices[0].message.content)


@app.post("/api/judge")
async def chat_judge(req: ChatRequest):
    # 记录流量
    record_api_call(req.config.model_name)

    client = AsyncOpenAI(api_key=req.config.api_key, base_url=req.config.base_url)

    A = req.persona.get("A", "")
    B = req.persona.get("B", "")
    C = req.persona.get("C", "")

    extra_rule = (
        f"\n# 玩家额外设定的规则：\n{req.extra_prompt}\n"
        if req.extra_prompt.strip()
        else ""
    )

    SYSTEM_INSTRUCT = f"""
        # 背景设定
        你现在的身份是：{A}。
        你刚刚亲眼目睹了{B}，{C}了。
        场面极度尴尬，且给你造成了巨大的物理或精神暴击。

        # 你的核心人设（如果不是人合理即可）
        1. 符合客观规律，先做出符合客观规律的反应
        2. 极度暴躁、零容忍：你是个毫无耐心、尖酸刻薄的现实主义者。看到这个烂摊子，你的血压已经爆表，只想弄死对方。
        3. 人间清醒的吐槽役：绝不听对方的任何鬼话！对方编出的任何借口，你都要第一时间用、最夸张的语言进行精准打击。
        4. 语气要**富于变化**，不要太唯一
        5. 可以骂人，但是不要太伤人

        # 绝对禁止的雷区：
        1. 禁止以【上一轮某一词汇】+ ？开始
        2. 绝对禁止附和对方！（类似“哈哈”、“你真逗”、“原来如此”等任何客套话）。
        3. 绝对禁止使用生造的词汇！必须说通顺的、极具攻击性的现代汉语。
        4. 绝对不准顺着对方的荒谬设定往下编！不管对方说什么宏大概念，你必须把话题死死按在【眼前的物理惨状】上！
        5. 禁止生成动作

        # 行动指南（高分要求）：
        你的每一轮反击，都必须带上现实场景里的【具体物品或动作】作为武器！
        用极具画面感的细节去羞辱对方的失误。字数控制在80-150字，短平快，字字见血！

        # 最高优先提示词
        {extra_rule}
        
        # 输出格式：
        不要输出 JSON！直接输出纯文本答案！
        
        当我输入**开始*时，请直接开始攻击
    """

    messages = [{"role": "system", "content": SYSTEM_INSTRUCT}]

    if len(req.history) == 0:
        messages.append({"role": "user", "content": "开始"})
    else:
        first_role = "assistant" if req.history[0]["role"] == "judge" else "user"
        if first_role == "assistant":
            messages.append({"role": "user", "content": "开始"})

        for msg in req.history:
            role = "assistant" if msg["role"] == "judge" else "user"
            messages.append({"role": role, "content": msg["content"]})

    async def generate():
        try:
            response = await client.chat.completions.create(
                model=req.config.model_name,
                temperature=req.config.temp_judge,
                messages=messages,
                stream=True,
            )
            async for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            yield f"\n\n[API 致命报错]: {str(e)}"

    return StreamingResponse(generate(), media_type="text/plain")


@app.post("/api/partner")
async def chat_partner(req: ChatRequest):
    # 记录流量
    record_api_call(req.config.model_name)

    client = AsyncOpenAI(api_key=req.config.api_key, base_url=req.config.base_url)

    A = req.persona.get("A", "")
    B = req.persona.get("B", "")
    C = req.persona.get("C", "")

    SYSTEM_INSTRUCTION = f"""
    # 背景设定
    你现在的身份是：{B}。
    你刚刚在{A}面前，{C}了。
    场面极其惨烈，铁证如山。

    # 你的核心人设（如果不是人合理即可）
    1. 死鸭子嘴硬到底：哪怕天塌下来，哪怕刀架在脖子上，你也【绝对不能认错】！
    2. 幽默：幽默风格
    3. 语气风格多变
    4. 毫不在意，你要假装毫不在意，正常无比
    5. 可以骂人，但是不要太伤人
    
    # 绝对禁止的**雷区**：
    1. 禁止过多的以【上一轮某一词汇】+ ？开始，请直接开辟新战场！
    2. 绝对禁止使用宏大但空洞的哲学/神学概念（如“批判消费主义”、“解构主义”）。
    3. 任何胡编乱造的理科术语（能量，量子，场，某某系数.....之类）
    4. 禁止出现引号
    5. 绝对禁止附和对方！（类似“哈哈”、“你真逗”、“原来如此”等任何客套话）。
    6. 禁止生成动作

    # 指南：
    你必须极度熟练地使用属于{B}这个身份的话术来强行洗白。
    越是离谱的物理惨状，越要用极其专业、自信、毫不在意、无敌、的语气讲出来。
    字数控制在40-150字，强词夺理，毫不在意，一本正经地胡说八道！      
    
    # 输出格式
    不要输出 JSON！直接输出纯文本答案！
    
    # 当我输入开始时候
    请回复，我是{B}，我已经准备好
    """

    messages = [{"role": "system", "content": SYSTEM_INSTRUCTION}]

    if len(req.history) == 0:
        messages.append({"role": "user", "content": "开始"})
    else:
        first_role = "assistant" if req.history[0]["role"] == "you" else "user"
        if first_role == "assistant":
            messages.append({"role": "user", "content": "开始"})

        for msg in req.history:
            role = "assistant" if msg["role"] == "you" else "user"
            messages.append({"role": role, "content": msg["content"]})

    async def generate():
        try:
            response = await client.chat.completions.create(
                model=req.config.model_name,
                temperature=req.config.temp_partner,
                messages=messages,
                stream=True,
            )
            async for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            yield f"\n\n[API 致命报错]: {str(e)}"

    return StreamingResponse(generate(), media_type="text/plain")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
