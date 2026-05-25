export const successResponse = <T>(data: T) => ({
  status: "success",
  data,
});

export const encryptedResponse = (payload: any, meta: object = {}) => ({
  status: "success",
  data: payload,
  ...meta,
});
