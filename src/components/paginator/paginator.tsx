import { FC } from "react";
import "./paginator.scss";

const Paginator: FC<{ currentPage: number; maxPages: number; onPageClick: (toPage: number) => any }> = ({
  currentPage,
  maxPages,
  onPageClick,
}) => {
  const steps: boolean[] = new Array(maxPages).fill(false);
  return (
    <>
      <div className={`mt-4 paginator-container ${maxPages >= 1 ? "" : "invisible-no-interaction"}`}>
        {steps.map((isCompleted, index) => {
          if (
            steps.length <= 5 ||
            currentPage == index - 1 ||
            currentPage == index ||
            currentPage == index + 1 ||
            index == steps.length - 1 ||
            index == 0
          ) {
            return (
              <div
                className={`pagination-page ${currentPage == index ? "current-page" : ""}`}
                key={"paginator-index-" + index}
                onClick={() => onPageClick(index)}>
                {index + 1}
              </div>
            );
          } else {
            return <span className="paginator-empty-space" key={"paginator-empty-space-" + index}></span>;
          }
        })}
      </div>
    </>
  );
};

export default Paginator;
