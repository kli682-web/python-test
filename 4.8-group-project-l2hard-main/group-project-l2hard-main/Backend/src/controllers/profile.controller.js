import UserProfile from "../models/UserProfile.model.js";

// 统一成功响应，保证前端拿到的返回结构始终一致。
const successResponse = (res, data, msg = "success", code = 200) => {
    res.status(code).json({
        code,
        msg,
        data
    });
};

// 统一错误响应，出错时 data 固定返回 null。
const errorResponse = (res, msg, code = 400) => {
    res.status(code).json({
        code,
        msg,
        data: null
    });
};

// 只返回前端真正需要的资料字段，避免把整个 mongoose 文档直接暴露出去。
const serializeProfile = (profile) => ({
    _id: profile._id,
    userId: profile.userId,
    preferredCuisine: profile.preferredCuisine,
    defaultBudget: profile.defaultBudget,
    defaultDistance: profile.defaultDistance,
    favoriteFoodCategories: profile.favoriteFoodCategories
});

// 把请求里的数组统一清洗成字符串数组：
// 1. 必须先保证传入值本身是数组
// 2. 每一项都转成字符串并去掉前后空格
// 3. 过滤空字符串，避免把无意义值存进数据库
const normalizeStringArray = (value) => {
    if (!Array.isArray(value)) {
        return null;
    }

    return value
        .map((item) => String(item).trim())
        .filter(Boolean);
};

// 用户第一次访问资料接口时，数据库里可能还没有 profile。
// 这里统一封装“先查，没有就创建”的逻辑，避免在多个接口里重复写。
const getOrCreateProfile = async (userId) => {
    let profile = await UserProfile.findOne({ userId });

    if (!profile) {
        // 只传 userId，其他字段交给 model 默认值处理。
        profile = await UserProfile.create({ userId });
    }

    return profile;
};

/**
 * 获取当前登录用户的偏好配置
 * 如果用户还没有个人偏好记录，则自动创建一份默认配置
 * @route GET /api/profile
 */
export const getProfile = async (req, res) => {
    try {
        // req.user 由鉴权中间件提前挂载，这里直接取当前登录用户 id。
        const profile = await getOrCreateProfile(req.user._id);

        // 返回前做一次序列化，保证接口输出稳定。
        return successResponse(res, serializeProfile(profile));
    } catch (error) {
        return errorResponse(res, error.message, 500);
    }
};

/**
 * 更新当前登录用户的偏好配置
 * 支持更新菜系偏好、预算、距离以及喜爱的食物分类
 * @route PUT /api/profile
 * @param {string[]=} preferredCuisine 偏好菜系列表，可选
 * @param {number=} defaultBudget 默认预算，可选
 * @param {number=} defaultDistance 默认搜索距离，可选
 * @param {string[]=} favoriteFoodCategories 喜爱的食物分类列表，可选
 */
export const updateProfile = async (req, res) => {
    try {
        const {
            preferredCuisine,
            defaultBudget,
            defaultDistance,
            favoriteFoodCategories
        } = req.body;

        // 更新前先拿到当前用户的 profile；如果不存在则自动创建。
        const profile = await getOrCreateProfile(req.user._id);

        if (preferredCuisine !== undefined) {
            // 只有调用方明确传了该字段时才更新。
            // 用 !== undefined 而不是简单真假判断，是为了允许传空数组来清空偏好。
            const normalizedPreferredCuisine = normalizeStringArray(preferredCuisine);

            if (!normalizedPreferredCuisine) {
                return errorResponse(res, "preferredCuisine must be an array");
            }

            // 保存清洗后的结果，避免数据库里出现带空格或空值的数据。
            profile.preferredCuisine = normalizedPreferredCuisine;
        }

        if (favoriteFoodCategories !== undefined) {
            const normalizedFavoriteFoodCategories = normalizeStringArray(favoriteFoodCategories);

            if (!normalizedFavoriteFoodCategories) {
                return errorResponse(res, "favoriteFoodCategories must be an array");
            }

            profile.favoriteFoodCategories = normalizedFavoriteFoodCategories;
        }

        if (defaultBudget !== undefined) {
            // 数值字段不在 controller 里手动校验，交给 mongoose schema 做约束。
            profile.defaultBudget = defaultBudget;
        }

        if (defaultDistance !== undefined) {
            profile.defaultDistance = defaultDistance;
        }

        // 统一在最后 save，一次性提交本次修改。
        await profile.save();

        return successResponse(res, serializeProfile(profile), "更新成功");
    } catch (error) {
        // 常见的字段格式错误、类型错误，按普通业务错误返回给前端。
        if (error.name === "ValidationError" || error.name === "CastError") {
            return errorResponse(res, error.message);
        }

        // 其余错误按服务端异常处理。
        return errorResponse(res, error.message, 500);
    }
};
