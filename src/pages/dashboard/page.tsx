import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// モックデータ
const recentPersonas = [
  {
    id: 1,
    name: "田中 優子",
    age: 28,
    occupation: "マーケター",
    createdAt: "2024-03-06",
  },
  {
    id: 2,
    name: "鈴木 健一",
    age: 35,
    occupation: "システムエンジニア",
    createdAt: "2024-03-06",
  },
  {
    id: 3,
    name: "佐藤 美咲",
    age: 42,
    occupation: "経営コンサルタント",
    createdAt: "2024-03-05",
  },
]

const recentFeedbacks = [
  {
    id: 1,
    personaName: "田中 優子",
    product: "ECサイトリニューアル",
    rating: 4,
    date: "2024-03-06",
  },
  {
    id: 2,
    personaName: "鈴木 健一",
    product: "モバイルアプリUI改善",
    rating: 3,
    date: "2024-03-06",
  },
  {
    id: 3,
    personaName: "佐藤 美咲",
    product: "新規サービス企画",
    rating: 5,
    date: "2024-03-05",
  },
]

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">ダッシュボード</h1>
        <p className="text-muted-foreground">
          ペルソナ生成とフィードバックの概要
        </p>
      </div>

      {/* サマリーカード */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>総ペルソナ数</CardTitle>
            <CardDescription>作成済みのペルソナ</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">24</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>フィードバック数</CardTitle>
            <CardDescription>収集済みの評価</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">156</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>平均評価</CardTitle>
            <CardDescription>全体の評価平均</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">4.2</p>
          </CardContent>
        </Card>
      </div>

      {/* 最近のペルソナ */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>最近のペルソナ</CardTitle>
              <CardDescription>最近生成されたペルソナ一覧</CardDescription>
            </div>
            <Button>新規作成</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名前</TableHead>
                <TableHead>年齢</TableHead>
                <TableHead>職業</TableHead>
                <TableHead>作成日</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPersonas.map((persona) => (
                <TableRow key={persona.id}>
                  <TableCell>{persona.name}</TableCell>
                  <TableCell>{persona.age}歳</TableCell>
                  <TableCell>{persona.occupation}</TableCell>
                  <TableCell>{persona.createdAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 最近のフィードバック */}
      <Card>
        <CardHeader>
          <CardTitle>最近のフィードバック</CardTitle>
          <CardDescription>ペルソナからの最新の評価</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ペルソナ</TableHead>
                <TableHead>評価対象</TableHead>
                <TableHead>評価</TableHead>
                <TableHead>日付</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentFeedbacks.map((feedback) => (
                <TableRow key={feedback.id}>
                  <TableCell>{feedback.personaName}</TableCell>
                  <TableCell>{feedback.product}</TableCell>
                  <TableCell>{feedback.rating}/5</TableCell>
                  <TableCell>{feedback.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 