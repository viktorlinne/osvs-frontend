import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageContainer } from "./PageContainer";

describe("PageContainer", () => {
  it("renders a div by default (AppLayout owns the <main> landmark)", () => {
    render(<PageContainer data-testid="pc">x</PageContainer>);
    expect(screen.getByTestId("pc").tagName).toBe("DIV");
    expect(screen.queryByRole("main")).not.toBeInTheDocument();
  });
});
