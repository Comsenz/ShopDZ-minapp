// pages/orderDetails/index.js
const app = getApp();
// var curl = 'https://miniapp.shopdz.cn/';
const curl = require('../../config').host;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: [],//商品列表
    data:null,
    price:null,
    totle_price:null,//优惠券优惠价格
    limit:null,//优惠券使用条件
    info: [],
    coupon_list:[],
    address: [],
    shipping_fee: [],
    mail:'',
    is_subject:true,
    is_address:false,
    is_coupon:false,
    display:false,
    address_id: null,//地址id
    num:null,//商品数量
    goodsid:null,//商品id
    coupon_id:null,//优惠券id
    order_message:null,//订单备注
    name: '',//姓名
    phone: '',//手机号
    address_s: null,//详情地址
    childAreaList: null,//所有省
    province: null,//所有市
    area: null,//所有县或地区
    province_id: null,//省份id
    info_province: null,//省份名字
    city_id: null,//城市id
    info_city: null,//城市名字
    area_id: null,//县或区id
    info_area: null,//县或区名字
    style: null,
    is_coupon_list:0,
    is_default: 1,
  },

  generate:function(id){
    var self = this;
    var id = id; 
    var key = wx.getStorageSync('key');
    var num = 0;
    wx.request({
      url: curl +'api.php/orders/settlement',
      data: { key: key, id: id},
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      method:'POST',
      success:function(res){
        if(res.data.code == 0){
          var address_id = 0;
          var info = res.data.data.goodsinfo; 
          var address = res.data.data.address;
          var coupon = res.data.data.coupon;
          var shipping_fee = res.data.data.shipping_fee;
          for (var i = 0; i < info.length; i++) {
            num = num + info[i].goods_price * info[i].goods_num;
            num = Number(num.toFixed(2));
            if(info[i].id == null){
              wx.showToast({
                title: "结算商品中有下架商品请删除下架商品再来结算",
                icon: 'none',
                duration: 1000
              })
              setTimeout(function () {  //使用  setTimeout（）方法设定定时2000毫秒
                wx.navigateBack();
              }, 1000);

            }
          }
          for (var i = 0; i < address.length; i++) {
            if (address[i].is_default == 1){
              address_id = address[i].address_id;
            }
          }
          console.log(address);
          self.setData({
            price:num,
            info:info,
            coupon_list:coupon,
            address_id: address_id,
            address:address,
            shipping_fee:shipping_fee,
          });
        }
        
      }
    })
  }, 
  buytlement:function(id,num){
    var self = this;
    var id = id;
    var num = num;
    var key = wx.getStorageSync('key');
    var totalPrice = 0;
    wx.request({
      url: curl + 'api.php/orders/buytlement',
      data: { key: key, id: id ,num:num},
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      method: 'POST',
      success: function (res) {
        if (res.data.code == 0) {
          var info = res.data.data.goodsinfo;
          var address = res.data.data.address;
          var address_id = 0;
          var shipping_fee = res.data.data.shipping_fee;
          var coupon = res.data.data.coupon;
          for (var i = 0; i < info.length; i++) {
            totalPrice = totalPrice + info[i].goods_price * info[i].goods_num;
          }
          for (var i = 0; i < address.length; i++) {
            if (address[i].is_default == 1) {
              address_id = address[i].address_id;
            }
          }
          console.log(res);
          self.setData({
            price: totalPrice,
            info: info,
            coupon_list:coupon,
            address_id: address_id,
            address: address,
            shipping_fee: shipping_fee,
          });
        }

      }
    })
  },
  py:function(){
    var self = this;
    var key = wx.getStorageSync('key');
    var address_id = self.data.address_id;
    var id = self.data.goodsid;
    var coupon_id = self.data.coupon_id;
    var order_message = self.data.order_message;
    var num = self.data.num;
    console.log(address_id);
    if (address_id == 0){
      wx.showToast({
        title: "请选择收货地址",
        icon: 'loading',
        duration: 2000
      })
      return;
    }
    if(num){
      var data = {
        id: id,
        num:num,
        address_id: address_id,
        coupon_id: coupon_id,
        order_message: order_message,
        key: key,
      }
      wx.request({
        url: curl + 'api.php/orders/buy',
        data: data,
        header: {
          'content-type': 'application/x-www-form-urlencoded' // 默认值
        },
        method: 'POST',
        success: function (res) {
          console.log(res);
          if (res.data.code == 0) {
            var openid = wx.getStorageSync('openid');
            var pay_sn = res.data.data.order_sn;
            wx.request({
              url: curl + 'api.php/paymentwx/pay?payment_code=wxx&pay_sn=' + pay_sn + '&oid=' + openid,
              method: 'GET',
              success: function (res) {
                console.log(res);
                if(res.data.code == 0){
                  self.pay(res.data.data, pay_sn);
                }
              }
            })
          }else{
            wx.showToast({
              title: res.data.msg,
              icon: 'loading',
              duration: 2000
            })
            return;
          }
        }
      })
    }else{
      var data = {
        id: id,
        address_id: address_id,
        coupon_id: coupon_id,
        order_message: order_message,
        key: key,
      }
      wx.request({
        url: curl +'api.php/orders/addOrder',
        data: data,
        header: {
          'content-type': 'application/x-www-form-urlencoded' // 默认值
        },
        method: 'POST',
        success:function(res){
          console.log(res);
          if(res.data.code == 0){
            var pay_sn = res.data.data.order_sn;
            var openid = wx.getStorageSync('openid');
            wx.request({
              url: curl + 'api.php/paymentwx/pay?payment_code=wxx&pay_sn=' + pay_sn + '&oid=' + openid,
              method:'GET',
              success:function(res){
                console.log(res);
                if (res.data.code == 0) {
                  self.pay(res.data.data, pay_sn);
                }
              }
            })
          }else{
            wx.showToast({
              title: res.data.msg,
              icon: 'loading',
              duration: 2000
            })
            return;
          }
        }
      })
    }
  },

  pay: function (data, pay_sn){
    var timeStamp = data.timeStamp;
    var nonceStr = data.nonceStr;
    var prepay_id = data.package;
    var signType = data.signType;
    var paySign = data.paySign;
    var pay_sn = pay_sn;
    wx.requestPayment({
      timeStamp: timeStamp,
      nonceStr: nonceStr,
      package: prepay_id,
      signType: signType,
      paySign: paySign,
      success:function(res){
        if (res.errMsg == 'requestPayment:ok'){
          wx.navigateTo({
            url: '../detail/detail?order_sn=' + pay_sn,
          });
        }
      },
      fail:function(res){
        wx.navigateBack();
      } 
    })
  },
  //省份
  bindChange: function (e) {
    var self = this;
    var province_id = self.data.childAreaList[e.detail.value].area_id;//省份id
    var province = self.data.childAreaList[e.detail.value].area_name;//省份名字
    if (e.detail.value) {
      self.province(province_id);
      self.setData({
        province_id: province_id,//省份id
        info_province: province,//省份名字
      })
    }
  },
  //市
  bindRegionChang: function (e) {
    var self = this;
    var city_id = self.data.province[e.detail.value].area_id;//城市id
    var city = self.data.province[e.detail.value].area_name;//城市名字
    if (e.detail.value) {
      self.area(city_id);
      this.setData({
        city_id: city_id,//城市id
        info_city: city,//城市名字
      })
    }
  },
  //区或县
  bindRegionChange: function (e) {
    var area = this.data.area[e.detail.value].area_name;
    if (e.detail.value) {
      this.setData({
        area_id: this.data.area[e.detail.value].area_id,//县或区id
        info_area: area,//县或区名字
      })
    }
  },

  //姓名
  bindKeyName: function (e) {
    this.setData({
      name: e.detail.value
    })
  },
  //电话
  bindKeyMobile: function (e) {
    this.setData({
      phone: e.detail.value
    })
  },
  //详情地址
  bindKeyDetailed: function (e) {
    this.setData({
      address_s: e.detail.value
    })
  },
  //提交
  submitFun: function () {
    var self = this;
    var key = wx.getStorageSync('key');
    var area_info = self.data.info_province + self.data.info_city + self.data.info_area;
    var params_wx = {
      key: key,
      true_name: self.data.name,
      province_id: self.data.province_id,
      city_id: self.data.city_id,
      area_id: self.data.area_id,
      area_info: area_info,
      address: self.data.address_s,
      tel_phone: self.data.phone,
      is_default: self.data.is_default,
    };
    wx.request({
      url: curl + 'api.php/Member/addressAdd',
      data: params_wx,
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      success: function (res) {
        if (self.data.goodsid && self.data.num){
          self.buytlement(self.data.goodsid, self.data.num);
        }else{
          self.generate(self.data.goodsid);
        }
        self.setData({
          is_address:false,
        });
      }
    })
  },

  //默认选中
  defaults: function (e) {
    var self = this;
    var is_default = e.currentTarget.dataset.id;
    if (is_default == 0) {
      self.setData({
        is_default: '1',
      });
    } else if (is_default == 1) {
      self.setData({
        is_default: '0',
      });
    }
  },
  //所有省份
  childAreaList: function () {
    var self = this;
    var key = wx.getStorageSync('key');
    wx.request({
      url: curl + 'api.php/Member/getChildAreaList',
      data: { key: key, area_parent_id: 0 },
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      success: function (res) {
        if (res.data.code == 0) {
          var childAreaList = res.data.data; var i = 0;
          self.setData({
            childAreaList: childAreaList,
          });
        }
      }
    })
  },
  //所有市
  province: function (province) {
    var self = this;
    var key = wx.getStorageSync('key');
    if (province) {
      wx.request({
        url: curl + 'api.php/Member/getChildAreaList',
        data: { key: key, area_parent_id: province },
        method: 'POST',
        header: {
          'content-type': 'application/x-www-form-urlencoded' // 默认值
        },
        success: function (res) {
          if (res.data.code == 0) {
            var province = res.data.data;
            self.setData({
              province: province,
            });
          }
        }
      })
    }
  },
  //所有区或县
  area: function (area) {
    var self = this;
    var key = wx.getStorageSync('key');
    if (area) {
      wx.request({
        url: curl + 'api.php/Member/getChildAreaList',
        data: { key: key, area_parent_id: area },
        method: 'POST',
        header: {
          'content-type': 'application/x-www-form-urlencoded' // 默认值
        },
        success: function (res) {
          if (res.data.code == 0) {
            var area = res.data.data;
            self.setData({
              area: area,
            });
          }
        }
      })
    }
  },
  //实时获取textarea里的内容
  bindTextAreaBlur: function (e) {
    this.setData({
      order_message: e.detail.value
    })

  },

  address:function(){
    var self = this;
    console.log(1212);
    var id = self.data.goodsid;
    var num = self.data.num;
    if(num){
      wx.navigateTo({
        url: '../address-Adds/index?id=' + id +'&num='+num,
      });
    }else{
      wx.navigateTo({
        url: '../address-Adds/index?id=' + id,
      });
    }
  },

  use_coupon:function(e){
    var self= this;
    var coupon_id = e.currentTarget.dataset.id;
    var limit = e.currentTarget.dataset.limit;
    var totle_price = e.currentTarget.dataset.price;
    var price = self.data.price;
    console.log(price, limit);
    if (coupon_id == 0 ){
      self.setData({
        coupon_id: '',
        limit: '',
        totle_price: '',
        is_coupon: false,
        is_coupon_list:1,
        is_subject: true,
      })
      return;
    }
    if (price < limit){
      wx.showToast({
        title: "此优惠券不可用！",
        icon: 'loading',
        duration: 2000
      })
      return;
    }
    self.setData({
      coupon_id: coupon_id,
      limit:limit,
      is_coupon_list: 0,
      totle_price:totle_price,
      is_coupon:false,
      is_subject:true,
    })
  },


  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var self = this;
    var id = options.id;
    var num = options.goods_num;
    if(num){
      self.buytlement(id,num);
      self.childAreaList();
      self.setData({
        num: num,
        goodsid: id,
      })
    }else{
      self.generate(id);
      self.childAreaList();
      self.setData({
        goodsid: id,
      })
    }
    console.log(options);

    // self.generate(id);
    // console.log(options)
    // app.http('v1/order/get', { id: options.id},"POST").then(res=>{
    //   console.log(res)
    //   if(res.code == 200){
    //     this.setData({data:res.data})
    //   }
    // })
  },

  display:function(){
    var self = this;
    self.setData({
      is_subject:false,
      is_display:true,
    });
  },
  coupon:function(){
    var self = this;
    self.setData({
      is_subject: false,
      is_coupon: true,
    });
  },
  selection:function(e){
    var self = this;
    var address_id = e.currentTarget.dataset.id;
    self.setData({
      address_id: address_id,
      is_display:false,
      is_subject:true,
    });
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // this.setData({
    //   address: app.globalData.userInfo.address
    // })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})