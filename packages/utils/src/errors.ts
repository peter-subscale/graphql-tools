import { GraphQLError } from 'graphql';

export const ERROR_SYMBOL = Symbol('subschemaErrors');

export function relocatedError(originalError: GraphQLError, path?: ReadonlyArray<string | number>): GraphQLError {
  return new GraphQLError(
    originalError.message,
    originalError.nodes,
    originalError.source,
    originalError.positions,
    path === null ? undefined : path === undefined ? originalError.path : path,
    originalError.originalError,
    originalError.extensions
  );
}

export function extendedError(originalError: GraphQLError, extensions: Record<string, any>): GraphQLError {
  return new GraphQLError(
    originalError.message,
    originalError.nodes,
    originalError.source,
    originalError.positions,
    originalError.path,
    originalError.originalError,
    extensions
  );
}

export function unextendedError(originalError: GraphQLError, extensionKey: string): GraphQLError {
  const originalExtensions = originalError.extensions;

  if (originalExtensions == null) {
    return originalError;
  }

  const originalExtensionKeys = Object.keys(originalExtensions);

  if (!originalExtensionKeys.length) {
    return originalError;
  }

  const newExtensions = {};
  let extensionsPresent = false;
  originalExtensionKeys.forEach(key => {
    if (key !== extensionKey) {
      newExtensions[key] = originalExtensions[key];
      extensionsPresent = true;
    }
  });

  if (!extensionsPresent) {
    return new GraphQLError(
      originalError.message,
      originalError.nodes,
      originalError.source,
      originalError.positions,
      originalError.path,
      originalError.originalError,
      undefined
    );
  }

  return new GraphQLError(
    originalError.message,
    originalError.nodes,
    originalError.source,
    originalError.positions,
    originalError.path,
    originalError.originalError,
    newExtensions
  );
}

export function slicedError(originalError: GraphQLError) {
  return relocatedError(originalError, originalError.path != null ? originalError.path.slice(1) : undefined);
}

export function getErrorsByPathSegment(errors: ReadonlyArray<GraphQLError>): Record<string, Array<GraphQLError>> {
  const record = Object.create(null);
  errors.forEach(error => {
    if (!error.path || error.path.length < 2) {
      return;
    }

    const pathSegment = error.path[1];

    const current = pathSegment in record ? record[pathSegment] : [];
    current.push(slicedError(error));
    record[pathSegment] = current;
  });

  return record;
}

export function setErrors(result: any, errors: Array<GraphQLError>) {
  result[ERROR_SYMBOL] = errors;
}

export function getErrors(result: any, pathSegment: string): Array<GraphQLError> {
  const errors = result != null ? result[ERROR_SYMBOL] : result;

  if (!Array.isArray(errors)) {
    return null;
  }

  const fieldErrors = [];

  for (const error of errors) {
    if (!error.path || error.path[0] === pathSegment) {
      fieldErrors.push(error);
    }
  }

  return fieldErrors;
}
