import { CustomButton } from "../pages/landing/styles"

export const UserGuide = ({ domain }: any) => {
  const openReadme = () => {
    window.location.href = "/user-guide";
  };

  return (<><p>Interested in learning more about? Click the button below to open the user guide.</p><CustomButton onClick={openReadme} color="primary" variant="contained">Open User Guide</CustomButton></>);

}