import { Routes, Route } from "react-router-dom";
import Screen01 from "./pages/screens/Screen01_현장관리_체크리스트";
import Screen02 from "./pages/screens/Screen02_대시보드_확인모달";
import Screen05 from "./pages/screens/Screen05_현장관리_팀관리";
import Screen06 from "./pages/screens/Screen06_현장관리_시간설정";
import Screen11 from "./pages/screens/Screen11_05_계정설정";
import Screen12 from "./pages/screens/Screen12_06_현장관리_팀관리_사본";
import Screen13 from "./pages/screens/Screen13_본사_회원가입";
import Screen14 from "./pages/screens/Screen14_본사_로그인";
import Screen15 from "./pages/screens/Screen15_현장관리_체크리스트";
import Screen17 from "./pages/screens/Screen17_현장관리_시간설정";
import Screen20 from "./pages/screens/Screen20_계정설정_사본";
import Screen22 from "./pages/screens/Screen22_문의하기";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Screen14 />} />
      <Route path="/auth/login" element={<Screen14 />} />
      <Route path="/auth/signup" element={<Screen13 />} />
      <Route path="/manager" element={<Screen01 />} />
      <Route path="/manager/sites" element={<Screen11 />} />
      <Route path="/manager/sites/team" element={<Screen12 />} />
      <Route path="/manager/sites/checklist" element={<Screen15 />} />
      <Route path="/manager/sites/schedule" element={<Screen17 />} />
      <Route path="/manager/account" element={<Screen20 />} />
      <Route path="/manager/contact" element={<Screen22 />} />
      <Route path="/screen/01" element={<Screen01 />} />
      <Route path="/screen/02" element={<Screen02 />} />
      <Route path="/screen/05" element={<Screen05 />} />
      <Route path="/screen/06" element={<Screen06 />} />
      <Route path="/screen/11" element={<Screen11 />} />
      <Route path="/screen/12" element={<Screen12 />} />
      <Route path="/screen/13" element={<Screen13 />} />
      <Route path="/screen/14" element={<Screen14 />} />
      <Route path="/screen/15" element={<Screen15 />} />
      <Route path="/screen/17" element={<Screen17 />} />
      <Route path="/screen/20" element={<Screen20 />} />
      <Route path="/screen/22" element={<Screen22 />} />
    </Routes>
  );
}
