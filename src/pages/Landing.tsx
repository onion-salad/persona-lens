import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto text-center px-4">
        <h1 className="text-6xl font-bold text-gray-900 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
          Persona Lens
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          多様なペルソナの視点からウェブサイトの第一印象を分析し、
          より魅力的なファーストビューを実現します
        </p>
        <div className="space-y-4">
          <Button 
            onClick={() => navigate("/steps")} 
            className="text-lg px-8 py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transform transition hover:scale-105"
          >
            分析を開始する
          </Button>
        </div>
      </div>
      
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 px-4 max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">多様な視点</h3>
          <p className="text-gray-600">様々なペルソナからの評価を通じて、幅広いユーザー層の視点を理解できます</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">詳細な分析</h3>
          <p className="text-gray-600">AIによる深い分析で、改善ポイントを具体的に把握できます</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">即座にフィードバック</h3>
          <p className="text-gray-600">リアルタイムで評価結果を確認し、すぐに改善アクションを取れます</p>
        </div>
      </div>
    </div>
  );
};

export default Landing;