import mongoose, { Schema } from "mongoose";

/**
 * Every frontend type (TuitionPost, Application, Tutor, ...) expects a plain
 * `id: string` field, but Mongoose's default toJSON output only has `_id`
 * (an ObjectId) and an internal `__v`. Nothing in the codebase was
 * translating between the two, so any response returned straight from a
 * model — which is most of them — silently broke frontend code that reads
 * `.id`. Rather than patch every schema's toJSON individually, this plugin
 * is applied globally (see config/db.ts) so every model gets a consistent,
 * frontend-friendly `id` field for free.
 */
export const idTransformPlugin = (schema: Schema): void => {
  schema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: Record<string, unknown>) => {
      if (ret._id) {
        ret.id = String(ret._id);
        delete ret._id;
      }
      return ret;
    },
  });
};

export const applyGlobalMongoosePlugins = (): void => {
  mongoose.plugin(idTransformPlugin);
};

// Side effect: applying the plugin the moment this module is imported. This
// file must be imported FIRST in server.ts (before "./app"), because Mongoose
// only applies plugins registered before a schema is compiled via
// `mongoose.model(...)` — and app.ts's import chain (routes -> controllers ->
// models) compiles every model as a side effect of being required.
applyGlobalMongoosePlugins();
