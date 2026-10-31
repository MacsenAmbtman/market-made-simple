import { describe, expect, it } from "vitest";
import { feedbackNotificationEmail } from "@/lib/email-templates";

describe("feedback notification email", () => {
  it("contains both answers, the page, and who sent it", () => {
    const mail = feedbackNotificationEmail({
      liked: "Loved the lessons",
      wanted: "More real companies",
      page: "/learn",
      signedIn: true,
      when: "Sat, 31 Oct 2026 01:00:00 GMT",
    });
    expect(mail.html).toContain("Loved the lessons");
    expect(mail.html).toContain("More real companies");
    expect(mail.html).toContain("/learn");
    expect(mail.text).toContain("a signed-in member");
  });

  it("escapes HTML in answers so they can't inject markup", () => {
    const mail = feedbackNotificationEmail({
      liked: "<script>alert(1)</script>",
      wanted: "",
      page: "/",
      signedIn: false,
      when: "now",
    });
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
    expect(mail.html).toContain("a guest");
  });

  it("omits the second question when it was left blank", () => {
    const mail = feedbackNotificationEmail({ liked: "Good stuff", wanted: "", page: "/", signedIn: false, when: "now" });
    expect(mail.html).not.toContain("features should we add");
  });
});
