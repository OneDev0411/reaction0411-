import mockContext from "/imports/test-utils/helpers/mockContext";
import sendResetAccountPasswordEmail from "./sendResetAccountPasswordEmail";

mockContext.mutations.sendResetAccountPasswordEmail = jest.fn().mockName("mutations.sendResetAccountPasswordEmail");

test("correctly passes through to internal mutation function", async () => {
  const fakeResult = "test@email.com";

  mockContext.mutations.sendResetAccountPasswordEmail.mockReturnValueOnce(Promise.resolve(fakeResult));

  const result = await sendResetAccountPasswordEmail(null, {
    input: {
      email: "test@email.com",
      clientMutationId: "clientMutationId"
    }
  }, mockContext);

  expect(mockContext.mutations.sendResetAccountPasswordEmail).toHaveBeenCalledWith(mockContext, {
    email: "test@email.com"
  });

  expect(result).toEqual({
    email: fakeResult,
    clientMutationId: "clientMutationId"
  });
});
