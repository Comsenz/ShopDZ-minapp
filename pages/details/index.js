// pages/details/index.js
var WxParse = require('../../plugins/wxParse/wxParse.js');  
const app = getApp()
const apiUrl = require('../../config').host;
// const apiUrl = 'http://shopdz.pm.comsenz-service.com';
const addCartUrl = apiUrl + '/api.php/basket/addBasket'; // 加入购物车
const favoritesUrl = apiUrl + '/api.php/favorites/favorites'; // 收藏
const hasfavoritesUrl = apiUrl + '/api.php/Favorites/hasfavorites';//是否收藏
Page({

  /**
   * 页面的初始数据
   */
  data: {

    indicatorDots: true,
    autoplay: true,
    interval: 5000,
    duration: 1000,
    goods_price:null,
    tabIs:true,
    specIs:false,
    data:{
    },
    // input默认是1
    num: 1,
    // 使用data数据对象设置样式名
    minusStatus: 'disabled',
    goodid:null,//当前商品的id
    goods_id:null,//选中颜色型号后的商品的id
    goods_name:null,//选中的商品名字
    isCollected:0,//是否收藏

  },
  //预览图片
  previewImage: function (e) {
    var current = e.target.dataset.src;

    wx.previewImage({
      current: current, // 当前显示图片的http链接  
      urls: this.data.data.goods_images // 需要预览的图片http链接列表  
    })
  },
  color: function (e) {
    var self = this;
    console.log(e);
    this.setData({
      //cid: e.currentTarget.dataset.index, 
      goods_id: e.currentTarget.dataset.current,
      goods_name: e.currentTarget.dataset.goods_name,
      goods_price: e.currentTarget.dataset.price,
    })
  },
  goShopCar: function () {
    var self = this;
    var goods_id = self.data.goodid;
    wx.navigateTo({
      url: "/pages/comment/index?goods_id=" + goods_id
    });
  }, 
  specFun(type){
    if (this.data.specIs){
      if (!type.currentTarget){
        if (!this.data.goods_id) {
          wx.showToast({
            title: "请选择商品参数",
            icon: 'loading',
            duration: 2000
          });
          var specIs = true;
        } else {
          var specIs = false;
        }
      }else{
        var specIs = false;
      }
    }else{
      var specIs = true;
    }
    this.setData({
      specIs: specIs
    })
  },
  addCart:function (){
    var self = this;
    var gooid = self.data.goods_id;
    if(!gooid){
      self.specFun(1);
      return;
    }
    if(self.data.num ==0){
      wx.showToast({
        title: '请设置商品数量',
        icon: 'none',
        duration: 2000
      })
    }
    var key = wx.getStorageSync('key');
    console.log(key);
    var params_wx = {
      id: gooid,
      num: self.data.num,
      type: 'detail',
      key: key,
    };

    wx.request({
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      url: addCartUrl,
      data: params_wx,
      success: function (res) {
        console.log(res);
        if (res.data.code == 0) {
          wx.showToast({
            title: '已加入购物车',
            icon: 'success',
            duration: 2000
          })
          self.specFun(1);
        } else {
          wx.showToast({
            title: res.data.msg,
            icon: 'loading',
            duration: 2000
          })
        }
      },
      fail: function (res) {
        console.log(res);
      },
      complete: function () {
        console.log('complete');
      }
    })
  },
  //返回顶部
  gotobtn: function () {
    var url = '../index/index';
    wx.switchTab({
      url: url,
    });
  },
  footprint: function (common_id){
    var common_id = common_id;
    var key = wx.getStorageSync('key');
    var self = this;
    wx.request({
      url: apiUrl +'/api.php/FootPrint/footprint',
      method:'GET',
      data: { key: key, common_id: common_id},
      success:function(res){
        console.log(res);
      }
    })
  },
  purchase:function(){
    var self = this;
    var gooid = self.data.goods_id;
    var num = self.data.num;
    if (!gooid) {
      self.specFun(1);
      return;
    }
    if(num == 0){
      wx.showToast({
        title: '请设置商品数量',
        icon: 'none',
        duration: 2000
      })
      return;
    }
    wx.navigateTo({
      url: '../orderDetails/index?id=' + gooid + '&goods_num=' + num,
    });
    
  },
  /* 点击减号 */
  bindMinus: function () {
    var num = this.data.num;
    // 如果大于1时，才可以减
    if (num > 1) {
      num--;
    }
    // 只有大于一件的时候，才能normal状态，否则disable状态
    var minusStatus = num <= 1 ? 'disabled' : 'normal';
    // 将数值与状态写回
    this.setData({
      num: num,
      minusStatus: minusStatus
    });
  },
  /* 点击加号 */
  bindPlus: function () {
    var num = this.data.num;
    // 不作过多考虑自增1
    num++;
    // 只有大于一件的时候，才能normal状态，否则disable状态
    var minusStatus = num < 1 ? 'disabled' : 'normal';
    // 将数值与状态写回
    this.setData({
      num: num,
      minusStatus: minusStatus
    });
  },
  /* 输入框事件 */
  bindManual: function (e) {
    var num = e.detail.value;
    var regPos = /^\d+(\.\d+)?$/; //非负浮点数
    var regNeg = /^(-(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*)))$/; //负浮点数
    if (regPos.test(num) || regNeg.test(num)) {
      if (num > 100) {
        wx.showToast({
          title: '数值过大',
          icon: 'loading',
          duration: 2000
        })
        return;
      }
      // 将数值与状态写回
      this.setData({
        num: num
      });
    } else {
      wx.showToast({
        title: '数量必须为数字',
        icon: 'loading',
        duration: 2000
      })
      return;
    }
    
    // // 将数值与状态写回
    // this.setData({
    //   num: num
    // });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this
    console.log(options)
    var goodid = options.id;
    //var goodid = 92;
    that.getgoodxq(goodid);
    that.hasfavorites(goodid);
    that.footprint(goodid);
    console.log(goodid);
     that.setData({
       goodid: goodid,
     });
    //WxParse.wxParse('article', 'html', this.data.goods_detail, this, 5); 
  },

  getgoodxq: function (gooid) {

    var that = this
    wx.request({
      url: apiUrl+'api.php/Goods/goods_detail?id=' + gooid,
      success: function (res) {
        if(res.data.code ==1){
          wx.showToast({
            title: res.data.msg,
            icon: 'none',
            duration: 2000
          });
          setTimeout(function () {  //使用  setTimeout（）方法设定定时2000毫秒
            wx.navigateBack();
          }, 800);
        }else{
          var article = res.data.data.goods_detail;     // 这里是ajax请求数据
          WxParse.wxParse('article', 'html', article, that, 5);
          that.setData({
            "data": res.data.data,
          });
        }
      }
    })

  },
  onShareAppMessage: function (e) {
    console.log(e);
    var self = this;
    var gid = e.target.dataset.id;
    var title = e.target.dataset.program;
    var img = e.target.dataset.img;
    return {
      title: title,
      path: '/pages/details/index?id=' + gid,
      imageUrl: img,
      success: function (res) {
        // 分享成功
        wx.showToast({
          title: '分享成功',
          icon: 'success',
          duration: 2000
        })
      },
      fail: function (res) {
        // 分享失败
      }
    }
  },
  //用户是否收藏
  hasfavorites: function (gooid){
    var that = this
    var key = wx.getStorageSync('key');
    var params_wx = {
      fav_id: gooid,
      key: key,
    };
    wx.request({
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      url: hasfavoritesUrl,
      data: params_wx,
      success: function (res) {
        if (res.data.data == true) {
          that.setData({
            isCollected: 1
          });
        }
      }
    })
  },
  //用户收藏
  user_collection:function(){
    var that = this
    var gooid = that.data.goodid;
    var key = wx.getStorageSync('key');
    var params_wx={
      fav_id: gooid,
      key: key,
      favorites_status: 0
    };
    wx.request({
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      url: favoritesUrl,
      data: params_wx,
      success: function (res) {
        if(res.data.code == 0){
          that.setData({
            isCollected:1
          });
          wx.showToast({
            title: res.data.msg,
            icon: 'success',
            duration: 2000
          })
        }
      }
    })
  },
  //取消收藏
  qxcollection:function(){
    var that = this
    var gooid = that.data.goodid;
    var key = wx.getStorageSync('key');
    var params_wx = {
      fav_id: gooid,
      key: key,
      favorites_status: 'is_favorites',
    };
    wx.request({
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded' // 默认值
      },
      url: favoritesUrl,
      data: params_wx,
      success: function (res) {
        if (res.data.code == 0) {
          that.setData({
            isCollected: 0
          });
          wx.showToast({
            title: res.data.msg,
            icon: 'success',
            duration: 2000
          })
        }
      }
    })
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
})