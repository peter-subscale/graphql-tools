import { GraphQLSchema, GraphQLFieldConfig } from 'graphql';

import { Request, ExecutionResult } from '@graphql-tools/utils';

import { Transform, DelegationContext, SubschemaConfig } from '@graphql-tools/delegate';

import { RootFieldTransformer, FieldNodeTransformer } from '../types';

import TransformObjectFields from './TransformObjectFields';

export default class TransformRootFields implements Transform {
  private readonly rootFieldTransformer: RootFieldTransformer;
  private readonly fieldNodeTransformer: FieldNodeTransformer;
  private transformer: TransformObjectFields;

  constructor(rootFieldTransformer: RootFieldTransformer, fieldNodeTransformer?: FieldNodeTransformer) {
    this.rootFieldTransformer = rootFieldTransformer;
    this.fieldNodeTransformer = fieldNodeTransformer;
  }

  public transformSchema(originalWrappingSchema: GraphQLSchema, subschemaConfig?: SubschemaConfig): GraphQLSchema {
    const queryTypeName = originalWrappingSchema.getQueryType()?.name;
    const mutationTypeName = originalWrappingSchema.getMutationType()?.name;
    const subscriptionTypeName = originalWrappingSchema.getSubscriptionType()?.name;

    const rootToObjectFieldTransformer = (
      typeName: string,
      fieldName: string,
      fieldConfig: GraphQLFieldConfig<any, any>
    ) => {
      if (typeName === queryTypeName) {
        return this.rootFieldTransformer('Query', fieldName, fieldConfig);
      }

      if (typeName === mutationTypeName) {
        return this.rootFieldTransformer('Mutation', fieldName, fieldConfig);
      }

      if (typeName === subscriptionTypeName) {
        return this.rootFieldTransformer('Subscription', fieldName, fieldConfig);
      }

      return undefined;
    };

    this.transformer = new TransformObjectFields(rootToObjectFieldTransformer, this.fieldNodeTransformer);

    return this.transformer.transformSchema(originalWrappingSchema, subschemaConfig);
  }

  public transformRequest(
    originalRequest: Request,
    delegationContext: DelegationContext,
    transformationContext: Record<string, any>
  ): Request {
    return this.transformer.transformRequest(originalRequest, delegationContext, transformationContext);
  }

  public transformResult(
    originalResult: ExecutionResult,
    delegationContext: DelegationContext,
    transformationContext: Record<string, any>
  ): ExecutionResult {
    return this.transformer.transformResult(originalResult, delegationContext, transformationContext);
  }
}
