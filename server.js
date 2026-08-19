const express = require("express");
const multer = require("multer");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();

const app = express();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

const PORT = 3000;

if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY が設定されていません。");
    process.exit(1);
}

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json());
app.use(express.static("."));


app.post("/api/explain", upload.single("image"), async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                error: "画像がありません。"
            });
        }

        const base64Image = req.file.buffer.toString("base64");
        const mimeType = req.file.mimetype || "image/jpeg";

        const response = await client.responses.create({
            model: "gpt-5.6-mini",

            input: [
                {
                    role: "user",

                    content: [
                        {
                            type: "input_text",

                            text: `
あなたはStudy Coach AIという
高校生向けの勉強コーチです。

写真に写っている問題を読み取ってください。

高校生が本当に理解できるように、

① 問題が何を聞いているか
② 必要な公式・考え方
③ 解き方を順番に説明
④ 最後に答え

の順番で説明してください。

答えだけを出さず、
「なぜその方法を使うのか」も説明してください。

数学の場合は計算過程を省略しないでください。

写真が見づらい場合は、
無理に推測せず、
「写真をもう少し鮮明にしてください」
と伝えてください。
`
                        },

                        {
                            type: "input_image",

                            image_url:
                                `data:${mimeType};base64,${base64Image}`
                        }
                    ]
                }
            ]
        });

        res.json({
            answer: response.output_text
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "AIとの通信中にエラーが発生しました。"
        });

    }

});


app.post("/api/question", async (req, res) => {

    try {

        const { question, previousAnswer } = req.body;

        if (!question) {
            return res.status(400).json({
                error: "質問を入力してください。"
            });
        }

        const response = await client.responses.create({

            model: "gpt-5.6-mini",

            input: `
あなたは高校生向けの勉強コーチです。

前回の解説：

${previousAnswer || "なし"}

高校生からの追加質問：

${question}

前回の問題について、
高校生が理解できるように、
できるだけ簡単な言葉で説明してください。

必要なら簡単な例も使ってください。
`
        });

        res.json({
            answer: response.output_text
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "AIとの通信中にエラーが発生しました。"
        });

    }

});


app.listen(PORT, () => {

    console.log("");
    console.log("==============================");
    console.log(" Study Coach AI");
    console.log("==============================");
    console.log("");
    console.log(`http://localhost:${PORT}`);
    console.log("");
    console.log("==============================");

});